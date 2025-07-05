const Order = require("../Schema/Order");
const Payment = require("../Schema/Payment");
const Book = require("../Schema/Book");
const User = require("../Schema/User");
const Report = require("../Schema/Report");
const fs = require("fs");
const path = require("path");
const { generatePDF } = require("../utils/pdfGenerator");

// Create reports directory if it doesn't exist
const reportsDir = path.join(__dirname, "../reports");
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir);
}

const generateReport = async (req, res) => {
  try {
    const { startDate, endDate, interval } = req.body;

    if (!startDate || !endDate || !interval) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required parameters" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Start date must be before end date",
        });
    }

    // Generate report data
    const reportData = {
      period: { start, end },
      summary: {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        totalBooksSold: 0,
        uniqueCustomers: 0,
        paymentMethods: { online: 0, cod: 0 },
        orderStatus: new Map(),
      },
      topBooks: [],
    };

    const startDateTime = new Date(start);
    startDateTime.setHours(0, 0, 0, 0);
    const endDateTime = new Date(end);
    endDateTime.setHours(23, 59, 59, 999);

    let orders = [];
    let payments = [];

    // Get orders and payments within date range
    try {
      orders = await Order.find({
        Order_Date: { $gte: startDateTime, $lte: endDateTime },
      }).populate("User_id");
    } catch (orderError) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Error fetching orders",
          error: orderError.message,
        });
    }

    try {
      payments = await Payment.find({
        payment_date: { $gte: startDateTime, $lte: endDateTime },
        payment_status: { $regex: /^completed$/i }, // Ensure completed payments are included
        payment_method: { $in: ["Razorpay", "COD"] }, // Include both Razorpay and COD
      });
    } catch (paymentError) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Error fetching payments",
          error: paymentError.message,
        });
    }

    // Calculate summary statistics
    reportData.summary.totalOrders = orders.length;
    reportData.summary.uniqueCustomers = new Set(
      orders.map((order) => order.User_id._id)
    ).size;

    // Calculate revenue and payment methods
    let totalRevenue = 0;
    try {
      payments.forEach((payment) => {
        if (
          payment &&
          payment.payment_status &&
          payment.payment_status.toLowerCase() === "completed"
        ) {
          // Check transaction type case-insensitively
          const transactionType = payment.transaction_Type
            ? payment.transaction_Type.toLowerCase()
            : "credit"; // default to credit if missing

          if (transactionType === "credit") {
            totalRevenue += payment.total_payment || 0;
          } else if (transactionType === "debit") {
            totalRevenue -= payment.total_payment || 0;
          }
        }
        console.log(totalRevenue);
      });
    } catch (paymentProcessingError) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Error processing payments",
          error: paymentProcessingError.message,
        });
    }
    reportData.summary.totalRevenue = totalRevenue;
    reportData.summary.averageOrderValue =
      orders.length > 0 ? totalRevenue / orders.length : 0;

    // Calculate payment methods
    try {
      payments.forEach((payment) => {
        if (
          payment &&
          payment.payment_status &&
          payment.payment_status.toLowerCase() === "completed"
        ) {
          const method = payment.payment_method
            ? payment.payment_method.trim().toLowerCase()
            : "";
          if (method === "razorpay") {
            reportData.summary.paymentMethods.online++;
          } else if (method === "cod") {
            reportData.summary.paymentMethods.cod++;
          } else {
            if (!reportData.summary.paymentMethods[method]) {
              reportData.summary.paymentMethods[method] = 0;
            }
            reportData.summary.paymentMethods[method]++;
          }
        }
      });
    } catch (paymentMethodError) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Error processing payment methods",
          error: paymentMethodError.message,
        });
    }

    // Calculate order status distribution
    try {
      orders.forEach(order => {
        if (order && order.Order_Status) {
          const status = order.Order_Status.toLowerCase();
          reportData.summary.orderStatus.set(status, (reportData.summary.orderStatus.get(status) || 0) + 1);
        }
        console.log(reportData.summary.orderStatus)
      });
      // Create a plain object version for JSON serialization
      reportData.summary.orderStatusObj = Object.fromEntries(reportData.summary.orderStatus);
    } catch (orderStatusError) {
      return res.status(500).json({ success: false, message: "Error processing order statuses", error: orderStatusError.message });
    }

    // Calculate book sales and revenue
    const bookSales = new Map();
    let totalBooksSold = 0;

    // First, get all book IDs from orders
    const bookIds = [
      ...new Set(
        orders.flatMap((order) => order.books.map((book) => book.book_id))
      ),
    ];

    // Fetch all books in one query
    const books = await Book.find({ _id: { $in: bookIds } });
    const bookMap = new Map(books.map((book) => [book._id.toString(), book]));

    // Calculate sales and revenue for each book
    orders.forEach((order) => {
      order.books.forEach((orderBook) => {
        const book = bookMap.get(orderBook.book_id.toString());
        if (!book) return;

        const bookInfo = bookSales.get(book._id.toString()) || {
          name: book.BookName || "Unknown Book",
          author: book.Author || "Unknown Author",
          sales: 0,
          revenue: 0,
        };

        const quantity = parseInt(orderBook.book_quantity) || 0;
        const price = parseFloat(book.Price) || 0;

        bookInfo.sales += quantity;
        bookInfo.revenue += quantity * price;
        totalBooksSold += quantity;

        bookSales.set(book._id.toString(), bookInfo);
      });
    });

    reportData.summary.totalBooksSold = totalBooksSold;

    // Convert book sales map to array and sort by sales
    reportData.topBooks = Array.from(bookSales.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10)
      .map((book) => ({
        name: book.name,
        author: book.author,
        sales: book.sales,
        revenue: book.revenue,
      }));

    // Generate PDF
    const pdfBuffer = await generatePDF(reportData);
    const pdfFileName = `report_${Date.now()}.pdf`;
    const pdfPath = path.join(reportsDir, pdfFileName);
    fs.writeFileSync(pdfPath, pdfBuffer);

    // Save report to database
    const report = new Report({
      ...reportData,
      pdfPath: pdfFileName,
    });
    await report.save();

    res.json({
      success: true,
      message: "Report generated successfully",
      data: {
        ...reportData,
        summary: {
          ...reportData.summary,
          orderStatus: reportData.summary.orderStatusObj,
        },
      },
    });
  } catch (error) {
    console.error("Error generating report:", error);
    res
      .status(500)
      .json({ success: false, message: "Error generating report" });
  }
};

const getReports = async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ success: false, message: "Error fetching reports" });
  }
};

const downloadReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await Report.findById(reportId);

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });
    }

    const pdfPath = path.join(reportsDir, report.pdfPath);
    if (!fs.existsSync(pdfPath)) {
      return res
        .status(404)
        .json({ success: false, message: "PDF file not found" });
    }

    res.download(pdfPath, `report_${reportId}.pdf`);
  } catch (error) {
    console.error("Error downloading report:", error);
    res
      .status(500)
      .json({ success: false, message: "Error downloading report" });
  }
};

module.exports = {
  generateReport,
  getReports,
  downloadReport,
};
