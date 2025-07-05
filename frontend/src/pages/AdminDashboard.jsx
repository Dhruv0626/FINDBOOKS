import React, { useEffect, useState } from "react";
import "../pages-css/AdminDashboard.css";
import { FaBook, FaBookOpen, FaHome } from "react-icons/fa";
import { FaUsers } from "react-icons/fa";
import { Navigate, NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AdminContext";
import Load from "../components/Load";
import Swal from "sweetalert2";
import { MdAdminPanelSettings } from "react-icons/md";
import { MdReport } from "react-icons/md";
import { MdReplay } from "react-icons/md";
import Cookies from "js-cookie";
import { FaTruckMoving } from "react-icons/fa";
import { useViewOrder } from "../Context/OrderDetail";
import {formatIndianNumber} from "../utils/formatIndianNumber"
import {
  Download,
  FileText,
  RefreshCw,
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  CreditCard,
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { autoTable } from "jspdf-autotable";
import { useAlert } from "../Context/AlertContext";

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div>
        <Load />
      </div>
    );
  }

  if (!user) {
    window.location.reload();
  } else {
    return children;
  }
};
const AdminDashboard = () => {
  const token = Cookies.get("token");

  const [user, getUser] = useState({});
  const [users, setUsers] = useState([]);
  const [bookdata, setBookdata] = useState([]);
  const [orders, setOrders] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const { setOrderDetails } = useViewOrder();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const handleLogout = () => {
    Cookies.remove("token");
    getUser(null);
    navigate("/");
  };

  useEffect(() => {
    const GetUser = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/User`, {
          credentials: "include",
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const json = await response.json();
        getUser(json.user);
      } catch (error) {
        showAlert("An error occurred. Please try again later.", "error");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    GetUser();
    const getOrders = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/Orders`, {
          credentials: "include",
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const json = await response.json();
        setOrders(json.orders);
      } catch (error) {
        showAlert("An error occurred. Please try again later.", "error");
        console.error(error);
      }
    };

    getOrders();

    const GetUsers = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/AllUser`, {
          credentials: "include",
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const json = await response.json();
        setUsers(json.users);
      } catch (error) {
        showAlert("An error occurred. Please try again later.", "error");
        console.error(error);
      }
    };

    GetUsers();

    const fetchBook = async () => {
      try {
        const [bookRes, sellOrderRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_RENDER_BACK}/api/Book`, {
            headers: {
              authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
          fetch(`${import.meta.env.VITE_RENDER_BACK}/api/resellerbook`, {
            headers: {
              authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
        ]);

        const [bookData, sellOrderData] = await Promise.all([
          bookRes.json(),
          sellOrderRes.json(),
        ]);

        if (!Array.isArray(bookData) || !sellOrderData?.resellers) {
          console.warn("Expected an array but got:", bookData, sellOrderData);
          setBookdata([]);
          return;
        }
        setBookdata(bookData);
      } catch (error) {
        showAlert("An error occurred. Please try again later.", "error");
        console.error(error);
      }
    };

    fetchBook();
  }, []);
  useEffect(() => {
    const getRevenue = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/verify`, {
          credentials: "include",
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();

        const totalRevenue = (data.payments || []).reduce((acc, pdata) => {
          const transactionType = pdata.transaction_Type?.toLowerCase();
          const paymentStatus = pdata.payment_status?.toLowerCase();
          const amount = parseFloat(pdata.total_payment) || 0;

          if (paymentStatus === "completed") {
            if (transactionType === "credit") {
              return acc + amount;
            } else if (transactionType === "debit" || transactionType === "refund") {
              return acc - amount;
            }
          }
          return acc;
        }, 0);

        setRevenue(totalRevenue);
      } catch (error) {
        console.error("Error fetching revenue:", error);
      } finally {
        setLoading(false);
      }
    };

    getRevenue();
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    Swal.fire({
      title: "Order Status",
      html: `Order ID <b>${orderId}</b> has been checked and is marked as shipped.`,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "OK",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (!result.isConfirmed) {
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_RENDER_BACK}/api/${orderId}/Order`,
          {
            method: "PUT",
            headers: {
              authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ status: newStatus }),
          }
        );

        const data = await response.json();
        if (data.notCollectedBooks) {
          showAlert(
            "Attention: The following book(s) in your order have not yet been collected: \n\n" +
              data.notCollectedBooks.join(",\n ") +
              "\n\n Please collect these book(s) to complete your order.",
            "error"
          );
        }

        if (data.order) {
          setOrders((prevOrders) =>
            prevOrders.map((order) =>
              order._id === orderId
                ? { ...order, Order_Status: newStatus }
                : order
            )
          );
        }
      } catch (error) {
        console.error("Error updating order status:", error);
        showAlert("Failed to update order status. Please try again.", "error");
      }
    });
  };
  const viewOrder = (orderdata, bookdata) => {
    const userdata = users.find((data) => data._id === orderdata.User_id);

    const filteredBooks = orderdata.books
      .map((bdata) => {
        const bookInfo = bookdata.find((data) => data._id === bdata.book_id);
        return bookInfo
          ? { ...bookInfo, book_quantity: bdata.book_quantity }
          : null;
      })
      .filter((book) => book !== null);

    setOrderDetails({ orderdata, userdata, bookdata: filteredBooks });
    navigate("/Admin/ViewOrder");
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_RENDER_BACK}/api/report/generate`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            interval: "6months",
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setReport(data.data);
      } else {
        showAlert("Failed to generate report", "error");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      showAlert("Error generating report", "error");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!report) return;

    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.text("Sales Report", 14, 15);
    doc.setFontSize(12);
    doc.text(
      `Period: ${new Date(
        report.period.start
      ).toLocaleDateString()} - ${new Date(
        report.period.end
      ).toLocaleDateString()}`,
      14,
      25
    );

    // Summary section
    doc.setFontSize(16);
    doc.text("Summary", 14, 35);
    doc.setFontSize(12);
    const summaryData = [
      ["Total Orders", report.summary.totalOrders || 0],
      ["Total Revenue", `₹${(report.summary.totalRevenue || 0).toFixed(2)}`],
      [
        "Average Order Value",
        `₹${(report.summary.averageOrderValue || 0).toFixed(2)}`,
      ],
      ["Total Books Sold", report.summary.totalBooksSold || 0],
      ["Unique Customers", report.summary.uniqueCustomers || 0],
    ];
    autoTable(doc, {
      startY: 45,
      head: [["Metric", "Value"]],
      body: summaryData,
      theme: "grid",
    });

    // Payment Methods
    doc.setFontSize(16);
    doc.text("Payment Methods", 14, doc.lastAutoTable.finalY + 10);
    doc.setFontSize(12);
    const paymentData = [
      ["Online Payments", report.summary.paymentMethods?.online || 0],
      ["Cash on Delivery", report.summary.paymentMethods?.cod || 0],
    ];
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [["Method", "Count"]],
      body: paymentData,
      theme: "grid",
    });

    // Order Status
    doc.setFontSize(16);
    doc.text("Order Status", 14, doc.lastAutoTable.finalY + 10);
    doc.setFontSize(12);
    const statusData = Object.entries(report.summary.orderStatus || {}).map(
      ([status, count]) => [status, count || 0]
    );
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [["Status", "Count"]],
      body: statusData,
      theme: "grid",
    });

    // Top Books
    doc.setFontSize(16);
    doc.text("Top Selling Books", 14, doc.lastAutoTable.finalY + 10);
    doc.setFontSize(12);
    const bookData = (report.topBooks || []).map((book) => [
      book.name || "Unknown",
      book.author || "Unknown",
      book.sales || 0,
      `₹${(book.revenue || 0).toFixed(2)}`,
    ]);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [["Book Name", "Author", "Sales", "Revenue"]],
      body: bookData,
      theme: "grid",
    });

    // Save the PDF
    doc.save("sales-report.pdf");
  };

  return (
    <div className="admin-dashboard-container">
      <aside className="sidebar">
        <h2>
          <MdAdminPanelSettings />
          Admin Panel
        </h2>
        <nav>
          <ul>
            <li>
              <NavLink to="/">
                <FaHome /> Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/Admin/ManageUsers">
                <FaUsers /> Users
              </NavLink>
            </li>
            <li>
              <NavLink to="/Admin/Orders">
                <FaTruckMoving /> Orders
              </NavLink>
            </li>
            <li>
              <NavLink to="/Admin/ManageBooks">
                <FaBookOpen /> Books
              </NavLink>
            </li>
            <li>
              <NavLink to="/Admin/AddCat">
                <FaBook /> Category
              </NavLink>
            </li>
            <li>
              <NavLink to="/Admin/ViewPayment">
                <CreditCard /> ViewPayment
              </NavLink>
            </li>
            <li>
              <NavLink to="/Admin/ManageReseller">
                <FaUsers /> Reseller
              </NavLink>
            </li>
            <li>
              <NavLink to="/Admin/RefundPayments">
                <MdReplay /> Refund Payments
              </NavLink>
            </li>
            <li>
              <NavLink to="/Admin/ReturnOrderReq">
                <MdReplay /> Return Order 
              </NavLink>
            </li>
            <li>
              <NavLink to="/Admin/Reports">
                <MdReport /> Reports
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="main-content">
        <div className="header-div">
          <header className="dashboard-header">
            <h1>Welcome, {user.First_name}</h1>
            <div className="header-actions">
              <div className="report-controls">
                <div className="date-range">
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, startDate: e.target.value })
                    }
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, endDate: e.target.value })
                    }
                  />
                </div>
                <button
                  className="generate-btn"
                  onClick={generateReport}
                  disabled={
                    loading || !dateRange.startDate || !dateRange.endDate
                  }
                >
                  {loading ? <RefreshCw className="spin" /> : <FileText />}
                  Generate Report
                </button>
              </div>
              <button className="logout-btn" onClick={handleLogout}>
                Log Out
              </button>
            </div>
          </header>
        </div>

        {report ? (
          <div className="report-section">
            <div className="report-header">
              <h2>Sales Report</h2>
              <button className="download-btn" onClick={downloadPDF}>
                <Download /> Download PDF
              </button>
            </div>

            <div className="summary-cards">
              <div className="summary-card">
                <DollarSign className="icon" />
                <div className="card-content">
                  <h3>Total Revenue</h3>
                  <p>₹{report.summary.totalRevenue}</p>
                </div>
              </div>
              <div className="summary-card">
                <ShoppingCart className="icon" />
                <div className="card-content">
                  <h3>Total Orders</h3>
                  <p>{report.summary.totalOrders}</p>
                </div>
              </div>
              <div className="summary-card">
                <TrendingUp className="icon" />
                <div className="card-content">
                  <h3>Average Order Value</h3>
                  <p>₹{report.summary.averageOrderValue}</p>
                </div>
              </div>
              <div className="summary-card">
                <Users className="icon" />
                <div className="card-content">
                  <h3>Unique Customers</h3>
                  <p>{report.summary.uniqueCustomers}</p>
                </div>
              </div>
            </div>

            <div className="report-grid">
              <div className="report-card">
                <h3>Payment Methods</h3>
                <div className="payment-methods">
                  <div className="method">
                    <span>Online Payments</span>
                    <span>{report.summary.paymentMethods.online}</span>
                  </div>
                  <div className="method">
                    <span>Cash on Delivery</span>
                    <span>{report.summary.paymentMethods.cod}</span>
                  </div>
                </div>
              </div>

              <div className="report-card">
                <h3>Order Status</h3>
                <div className="order-status">
                  {console.log(report.summary.orderStatus)}
                  {Object.entries(report.summary.orderStatus).map(
                    ([status, count]) => (
                      <div key={status} className="status-item">
                        <span className="status-label">{status}</span>&nbsp;
                        <span className="status-count">{count}</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="report-card full-width">
                <h3>Top Selling Books</h3>
                <div className="top-books">
                  <table>
                    <thead>
                      <tr>
                        <th>Book Name</th>
                        <th>Author</th>
                        <th>Sales</th>
                        <th>type</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.topBooks.map((book, index) => (
                        <tr key={index}>
                          <td>{book.name}</td>
                          <td>{book.author}</td>
                          <td>{book.sales}</td>
                          <td>{book.isoldbook === true ? "RESELL" : "NEW"}</td>
                          <td>₹{book.revenue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <section className="statistics">
              <div
                className="stat-card"
                onClick={() => navigate("/Admin/ManageUsers")}
              >
                <h3>Users</h3>
                <p>{users.length || 0}</p>
              </div>
              <div className="stat-card">
                <h3>Orders</h3>
                <p>
                  {orders.filter((order) => order.Order_Status !== "Delivered")
                    .length || 0}
                </p>
              </div>
              <div className="stat-card">
                <h3>Revenue</h3>
                <p>₹{revenue.toFixed(2)}</p>
              </div>
              <div
                className="stat-card"
                onClick={() => navigate("/Admin/ManageBooks")}
              >
                <h3>Books</h3>
                <p>{bookdata.length || 0}</p>
              </div>
            </section>
            <section className="data-table">
              <h2>Recent Orders</h2>
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Action</th>
                    <th>Shipped</th>
                  </tr>
                </thead>
                <tbody>
                  {orders
                    .slice()
                    .reverse()
                    .filter((order) => {
                      return (
                        // order.Order_Status === "Shipped" ||
                        order.Order_Status === "Pending"
                      );
                    })
                    .map((order) => {
                      const userDetail = users.find(
                        (user) => user._id === order.User_id
                      );
                      const userName = userDetail
                        ? `${userDetail.First_name} ${userDetail.Last_name}`
                        : "Unknown User";

                      return (
                        <tr key={order._id}>
                          <td>{order._id}</td>
                          <td>{userName}</td>
                          <td>{order.Order_Status}</td>
                          <td>₹{formatIndianNumber(order.Total_Amount)}</td>
                          <td>
                            <button
                              className="action-btn"
                              onClick={() => viewOrder(order, bookdata)}
                            >
                              View
                            </button>
                          </td>
                          <td>
                            {["Delivered", "Cancelled"].includes(
                              order.Order_Status
                            ) ? (
                              <button className="action-btn" disabled>
                                {order.Order_Status}
                              </button>
                            ) : (
                              <button
                                className="action-btn"
                                onClick={() =>
                                  updateOrderStatus(
                                    order._id,
                                    order.Order_Status === "Shipped"
                                      ? "Pending"
                                      : "Shipped"
                                  )
                                }
                              >
                                {order.Order_Status === "Shipped"
                                  ? "Pending"
                                  : "Shipped"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export { AdminDashboard, AdminRoute };
