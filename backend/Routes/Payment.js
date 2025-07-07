const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../Schema/Payment");
const Order = require("../Schema/Order");
const Cart = require("../Schema/Cart");
const Book = require("../Schema/Book");
const Reseller = require("../Schema/Reseller");
const authenticateToken = require("../middleware/AuthMid");
const RefundPayment = require("../Schema/RefundPayment");

// Valid order statuses
const VALID_ORDER_STATUSES = [
  "Pending",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Return",
];

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_SECRET = process.env.RAZORPAY_SECRET;

const instance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_SECRET,
});

router.post("/orders", async (req, res) => {
  try {
    console.log("RP" + req.body.amount);
    const options = {
      amount: req.body.amount * 100,
      currency: "INR",
      receipt: crypto.randomBytes(10).toString("hex"),
    };

    instance.orders.create(options, (error, order) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ message: "Something Went Wrong!" });
      }
      res.status(200).json({
        data: {
          ...order,
          key: RAZORPAY_KEY_ID,
        },
      });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error!" });
  }
});

router.post("/verify", authenticateToken, async (req, res) => {
  try {
    const {
      razorpay_orderID,
      razorpay_paymentID,
      razorpay_signature,
      orderID,
    } = req.body;
    const order = await Order.findOne({ User_id: req.userId }).sort({
      createdAt: 1,
    });
    const sign = razorpay_orderID + "|" + razorpay_paymentID;
    const resultSign = crypto
      .createHmac("sha256", RAZORPAY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === resultSign) {
      const payment = new Payment({
        payment_id: razorpay_paymentID,
        order_id: orderID,
        payment_date: new Date(),
        payment_method: "Razorpay",
        payment_status: "Completed",
        total_payment: req.body.order,
        transaction_Type: "credit",
      });

      const savedPayment = await payment.save();

      return res.status(200).json({ payment: savedPayment });
    } else {
      return res.status(400).json({ message: "Invalid signature" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error!" });
  }
});

router.get("/verify", authenticateToken, async (req, res) => {
  try {
    // Fetch all payments, populate order details, and then populate user details
    const payments = await Payment.find({}).populate({
      path: "order_id",
      populate: {
        path: "User_id", // Ensure it matches the field in OrderSchema
        model: "User", // Explicitly mention the User model
        select: "First_name Last_name", // Fetch only necessary fields
      },
    });

    if (!payments || payments.length === 0) {
      return res.status(404).json({ error: "No payment record found" });
    }

    res.json({ payments });
  } catch (error) {
    console.error("Error fetching payment data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/payment/:order_id", authenticateToken, async (req, res) => {
  try {
    const { order_id } = req.params;
    const payment = await Payment.findOne({ order_id });
    if (!payment) {
      return res
        .status(404)
        .json({ message: "Payment not found for this order" });
    }
    res.status(200).json({ payment });
  } catch (error) {
    console.error("Error fetching payment data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.put("/addorder", authenticateToken, async (req, res) => {
  try {
    const { cartid, TotalAmount, status } = req.body;

    let cart = await Cart.findOne({ _id: cartid });
    console.log("cartId", cart);
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    let order = await Order.findOne({ Cart_id: cartid });
    console.log("order s", order);
    if (!order) {
      return res.status(404).json({ message: "Order not found for this cart" });
    }

    const updatedBooks = cart.books.map((item) => ({
      book_id: item.book_id,
      book_quantity: item.book_quantity,
    }));

    // If status is provided and valid, update it
    if (status && VALID_ORDER_STATUSES.includes(status)) {
      order.Order_Status = status;
    }

    order.Total_Amount = TotalAmount;
    order.books = updatedBooks;
    console.log("order after", order);
    await order.save();

    const bookIds = order.books.map((item) => item.book_id); // Extract book IDs
    console.log("boookboook", bookIds);
    // Fetch resellers who have matching book IDs

    let resellers = await Reseller.find({
      Book_id: { $in: bookIds }, // Ensure field name matches schema
    });
    console.log("reeeseeeler", resellers);

    // If matching resellers are found, update their status
    for (let reseller of resellers) {
      reseller.Resell_Status = "Sell"; // Correct assignment
      await reseller.save(); // Save each document individually
    }

    res.status(200).json({ message: "Order updated successfully", order });
  } catch (error) {
    console.error("Error processing order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Add a new route for updating order status
router.put(
  "/:orderId/status",
  authenticateToken,
  [
    body("status")
      .isIn(VALID_ORDER_STATUSES)
      .withMessage(`Status must be one of: ${VALID_ORDER_STATUSES.join(", ")}`),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { orderId } = req.params;
      const { status } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // If status is "Cancelled" and order contains old books, update reseller status to "Pending"
      if (status === "Cancelled") {
        // Populate books.book_id to access Isoldbook field
        await order.populate("books.book_id");

        // Filter books that are old
        const oldBooks = order.books.filter(
          (item) => item.book_id && item.book_id.Isoldbook
        );

        if (oldBooks.length > 0) {
          const oldBookIds = oldBooks.map((item) => item.book_id._id);

          // Find resellers with these old book IDs
          const resellers = await Reseller.find({
            Book_id: { $in: oldBookIds },
          });

          // Update reseller status to "Pending"
          for (let reseller of resellers) {
            reseller.Resell_Status = "Pending";
            await reseller.save();
          }
        }

        // Update payment status to "Cancelled" for this order
        try {
          const payments = await Payment.find({
            order_id: orderId,
            payment_method: "Razorpay",
          });
          if (payments.length === 0) {
            console.log(`No Razorpay payments found for order ${orderId}`);
          } else {
            for (const payment of payments) {
              payment.payment_status = "Cancelled";
              await payment.save();
            }
          }
        } catch (err) {
          console.error("Error updating payment status:", err);
        }
      }

      order.Order_Status = status;
      await order.save();

      res
        .status(200)
        .json({ message: "Order status updated successfully", order });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.post(
  "/:transaction_Type/codpayment",
  authenticateToken,
  [
    body("order_id").notEmpty().withMessage("Order ID is required"),
    body("payment_method").notEmpty().withMessage("Payment method is required"),
    body("payment_status").notEmpty().withMessage("Payment status is required"),
    body("total_payment")
      .isFloat({ gt: 0 })
      .withMessage("Total payment must be a positive number"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error("Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { transaction_Type } = req.params;
      const { order_id, payment_method, payment_status, total_payment } =
        req.body;

      const order_model =
        transaction_Type === "debit"
          ? "Reseller"
          : transaction_Type === "credit"
          ? "Order"
          : transaction_Type === "refund"
          ? "Order_Refund"
          : "Order";

      const cod = new Payment({
        order_id,
        payment_method,
        order_model: order_model,
        payment_status,
        total_payment: total_payment,
        transaction_Type,
      });

      const savedPayment = await cod.save();

      return res.status(201).json({ payment: savedPayment });
    } catch (error) {
      console.error("Error saving payment:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.put("/codpayment", authenticateToken, async (req, res) => {
  try {
    const { paymentid, payment_date } = req.body;

    const payment = await Payment.findById(paymentid);

    payment.payment_status = "Completed";
    if (payment_date) {
      payment.payment_date = new Date(payment_date);
    }
    await payment.save();
    res.status(200).json({
      message: "Order status updated successfully",
    });
  } catch (error) {
    console.error("Error saving payment:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/orders/return-pending", async (req, res) => {
  try {
    const orders = await Order.find({ Order_Status: "return-pending" });
    res.status(200).json({ orders });
  } catch (error) {
    console.error("Error fetching return-pending orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Unified Refund Request API (COD or Razorpay) - only saves the request
router.post("/refund/:order_id", authenticateToken, async (req, res) => {
  try {
    const { order_id } = req.params;
    const { reason, upi_id, bank_acc_no, ifsc_code } = req.body;

    if (!order_id) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    if (!reason) {
      return res.status(400).json({ message: "Refund reason is required" });
    }

    const payment = await Payment.findOne({ order_id });
    if (!payment) {
      return res
        .status(404)
        .json({ message: "Payment not found for this order" });
    }

    // Prevent duplicate refund
    const existingRefund = await RefundPayment.findOne({
      payment_id: payment._id,
    });
    if (existingRefund) {
      return res
        .status(400)
        .json({ message: "Refund request already submitted" });
    }

    const refundPayload = {
      payment_id: payment._id,
      refund_date: null,
      refund_status: "Pending",
      refund_method: "Online",
      reason,
      refund_amount: payment.total_payment,
    };

    if (payment.payment_method === "COD") {
      if (!upi_id && (!bank_acc_no || !ifsc_code)) {
        return res.status(400).json({
          message: "UPI ID or Bank account details are required for COD refund",
        });
      }
      refundPayload.upi_id = upi_id;
      refundPayload.bank_acc_no = bank_acc_no;
      refundPayload.ifsc_code = ifsc_code;
    }

    const refundPayment = new RefundPayment(refundPayload);
    await refundPayment.save();

    return res
      .status(201)
      .json({ message: "Refund request submitted", refundPayment });
  } catch (error) {
    console.error("Refund API error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.put("/refund/:id", authenticateToken, async (req, res) => {
  try {
    console.log("📩 Refund update request received");
    const { refund_status } = req.body;
    const refundPayment = await RefundPayment.findById(req.params.id).populate("payment_id");

    if (!refundPayment) {
      return res.status(404).json({ message: "Refund not found" });
    }

    const payment = refundPayment.payment_id;
    console.log("Refund ID:", refundPayment._id.toString());
    console.log("Requested status:", refund_status);
    console.log("🔍 Populated payment:", payment);

    // ✅ Razorpay refund process
    if (refund_status === "Completed" && payment.payment_method === "Razorpay") {
      try {
        console.log("⚙️ Initiating Razorpay refund process...");

        const razorpayRefund = await new Promise((resolve, reject) => {
          instance.payments.refund(
            payment.payment_id,
            {
              amount: payment.total_payment * 100, // Multiply by 100 to convert to paise
            },
            (err, result) => {
              if (err) {
                console.log("❌ Razorpay refund error:", err);
                reject(err);
              } else {
                resolve(result);
              }
            }
          );
        });

        // ✅ Update refund and create debit entry
        refundPayment.refund_status = "Completed";
        refundPayment.refund_date = new Date();
        refundPayment.razorpay_refund_id = razorpayRefund.id;
        await refundPayment.save();

        const refundDebit = new Payment({
          order_id: payment.order_id,
          order_model: "Order_Refund",
          payment_method: payment.payment_method,
          payment_status: "Completed",
          total_payment: payment.total_payment,
          transaction_Type: "refund",
        });
        await refundDebit.save();
        console.log("✅ Debit entry created for Razorpay refund:", refundDebit);

        return res.status(200).json({
          message: "Razorpay refund completed",
          refund: razorpayRefund,
        });
      } catch (err) {
        console.error("Razorpay refund failed:", err);
        return res.status(500).json({ message: "Razorpay refund failed", error: err });
      }
    }

    // ✅ COD refund logic
    if (refund_status === "Completed" && payment.payment_method === "COD") {
      refundPayment.refund_status = "Completed";
      refundPayment.refund_date = new Date();
      await refundPayment.save();

      const refundDebit = new Payment({
        order_id: payment.order_id,
        order_model: "Order_Refund",
        payment_method: payment.payment_method,
        payment_status: "Completed",
        total_payment: payment.total_payment,
        transaction_Type: "refund",
      });
      await refundDebit.save();
      console.log("✅ Debit entry created for COD refund:", refundDebit);

      return res.status(200).json({ message: "COD refund completed", refundPayment });
    }

    // ✅ Only update refund status for Pending/Rejected
    if (["Pending", "Rejected"].includes(refund_status)) {
      refundPayment.refund_status = refund_status;
      await refundPayment.save();
      console.log("🔄 Refund status updated without refund execution.");
      return res.status(200).json({ message: "Refund status updated", refundPayment });
    }

    return res.status(400).json({ message: "Invalid refund status update" });
  } catch (error) {
    console.error("Refund update error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET /refunds - Fetch all refund requests (optionally filter by status)
// server/api/refund.js or wherever your route is
router.get("/refunds", authenticateToken, async (req, res) => {
  try {
    const refunds = await RefundPayment.find({}).populate({
      path: "payment_id",
      model: "Payment",
      select: "total_payment order_id", // ✅ Include total_payment
      populate: {
        path: "order_id",
        model: "Order",
        select: "Order_Status User_id",
        populate: {
          path: "User_id",
          model: "User",
          select: "First_name Last_name",
        },
      },
    });

    if (!refunds || refunds.length === 0) {
      return res.status(404).json({ message: "No refund records found" });
    }

    const formattedRefunds = refunds.map((refund) => ({
      _id: refund._id,
      refund_date: refund.refund_date,
      refund_status: refund.refund_status,
      refund_method: refund.refund_method,
      reason: refund.reason,
      upi_id: refund.upi_id,
      bank_acc_no: refund.bank_acc_no,
      ifsc_code: refund.ifsc_code,
      razorpay_refund_id: refund.razorpay_refund_id,
      payment_id: refund.payment_id?._id?.toString() || "N/A",
      total_payment: refund.payment_id?.total_payment ?? "N/A", // ✅ Safe access
      order_status: refund.payment_id?.order_id?.Order_Status || "N/A",
      user_name:
        refund.payment_id?.order_id?.User_id?.First_name +
          " " +
          refund.payment_id?.order_id?.User_id?.Last_name || "N/A",
    }));

    res.status(200).json({ refundPayment: formattedRefunds });
  } catch (error) {
    console.error("Error fetching refunds:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET /refund/:id - Fetch refund by RefundPayment _id
router.get("/refunds/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const refund = await RefundPayment.findById(id).populate({
      path: "payment_id",
      model: "Payment",
      select: "total_payment order_id",
      populate: {
        path: "order_id",
        model: "Order",
        populate: {
          path: "User_id",
          model: "User",
          select: "First_name Last_name",
        },
      },
    });

    if (!refund) {
      return res.status(404).json({ message: "Refund not found" });
    }

    // Send flattened refund with total_payment
    const result = {
      _id: refund._id,
      refund_date: refund.refund_date,
      refund_status: refund.refund_status,
      refund_method: refund.refund_method,
      reason: refund.reason,
      upi_id: refund.upi_id,
      bank_acc_no: refund.bank_acc_no,
      ifsc_code: refund.ifsc_code,
      razorpay_refund_id: refund.razorpay_refund_id,
      payment_id: refund.payment_id?._id?.toString() || "N/A",
      total_payment: refund.payment_id?.total_payment || 0,
      order_status: refund.payment_id?.order_id?.Order_Status || "N/A",
      user_name:
        refund.payment_id?.order_id?.User_id?.First_name +
          " " +
          refund.payment_id?.order_id?.User_id?.Last_name || "N/A",
    };

    res.status(200).json({ refund: result });
  } catch (error) {
    console.error("Error fetching refund by ID:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;

