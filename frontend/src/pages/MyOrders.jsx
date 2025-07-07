import React, { useEffect, useState } from "react";
import { Navbar } from "../components/Navbar";
import "../pages-css/MyOrders.css";
import { ProfileMenu } from "../components/ProfileMenu";
import { Package, Calendar, CreditCard, Truck } from "lucide-react";
import Load from "../components/Load";
import { useAlert } from "../Context/AlertContext";
import ReturnOrderForm from "../components/ReturnOrderForm";
import Cookies from "js-cookie";
import { SiRazorpay } from "react-icons/si";
import { useNavigate } from "react-router-dom";
import RefundPaymentForm from "../components/RefundPaymentForm";

export const MyOrders = () => {
  const [order, setOrder] = useState([]);
  const token = Cookies.get("token");
  const [book, setBook] = useState([]);
  const [resellerEntries, setResellerEntries] = useState([]);
  const [payments, setPayments] = useState({});
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();
  const [returnmessage, setReturnmessage] = useState("");
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundOrderId, setRefundOrderId] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_RENDER_BACK}/api/Order`,
          {
            credentials: "include",
            headers: {
              authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const json = await response.json();
        const newOrders = Array.isArray(json.orders) ? json.orders : [];
        const newBooks = Array.isArray(json.books) ? json.books : [];

        setOrder(newOrders);
        setBook(newBooks);
        setUserEmail(json.userEmail);

        // Fetch payment data for each order
        const paymentsData = {};
        await Promise.all(
          newOrders.map(async (order) => {
            try {
              const paymentResponse = await fetch(
                `${import.meta.env.VITE_RENDER_BACK}/api/payment/${order._id}`,
                {
                  credentials: "include",
                  headers: {
                    authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                }
              );
              if (paymentResponse.ok) {
                const paymentJson = await paymentResponse.json();
                // console.log(`Payment data for order ${order._id}:`, paymentJson);
                paymentsData[order._id] = paymentJson.payment
                  ? paymentJson.payment.payment_method
                  : null;
              } else {
                paymentsData[order._id] = null;
              }
            } catch (error) {
              console.error(
                `Error fetching payment for order ${order._id}:`,
                error
              );
              paymentsData[order._id] = null;
            }
          })
        );
        setPayments(paymentsData);
      } catch (error) {
        console.error("Error fetching order data:", error);
      }
    };

    const fetchResellerEntries = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_RENDER_BACK}/api/SellOrders`,
          {
            credentials: "include",
            headers: {
              authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setResellerEntries(data.resellerdata || []);
        }
      } catch (error) {
        console.error("Error fetching reseller entries:", error);
      }
    };

    Promise.all([fetchOrders(), fetchResellerEntries()]).finally(() =>
      setLoading(false)
    );
  }, []);

  useEffect(() => {
    const autoRefundRazorpayReturns = async () => {
      for (const orderItem of order) {
        if (
          orderItem.Order_Status === "return-pending" &&
          payments[orderItem._id] === "Razorpay"
        ) {
          await processRefund(orderItem._id, "Return order refund");
        }
      }
    };

    autoRefundRazorpayReturns();
  }, [order, payments]);

  const updateOrderStatus = async (orderId, newStatus) => {
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

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      setOrder((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, Order_Status: newStatus } : order
        )
      );

      if (newStatus === "Cancelled") {
        const cancelledOrder = order.find((o) => o._id === orderId);
        if (cancelledOrder) {
          const hasResellerBook = cancelledOrder.books.some((bookItem) => {
            const matchedBook = book.find((b) => b._id === bookItem.book_id);
            return matchedBook?.Isoldbook === true;
          });
          if (hasResellerBook) {
            for (const bookItem of cancelledOrder.books) {
              const matchedBook = book.find((b) => b._id === bookItem.book_id);
              if (matchedBook?.Isoldbook === true) {
                const resellerEntry = resellerEntries.find(
                  (reseller) =>
                    reseller.Book_id === matchedBook._id &&
                    reseller.User_id === cancelledOrder.User_id
                );
                if (resellerEntry) {
                  try {
                    const resellerResponse = await fetch(
                      `${import.meta.env.VITE_RENDER_BACK}/api/Pending/SellOrders`,
                      {
                        method: "PUT",
                        headers: {
                          authorization: `Bearer ${token}`,
                          "Content-Type": "application/json",
                        },
                        credentials: "include",
                        body: JSON.stringify({
                          resellerid: resellerEntry._id,
                          bookid: matchedBook._id,
                        }),
                      }
                    );
                    if (!resellerResponse.ok) {
                      console.error(
                        "Failed to update reseller status for book",
                        matchedBook._id
                      );
                    }
                  } catch (error) {
                    console.error("Error updating reseller status:", error);
                  }
                }
                try {
                  const cancelEmailResponse = await fetch(
                    `${import.meta.env.VITE_RENDER_BACK}/cancel-seller-email/${
                      matchedBook._id
                    }`,
                    {
                      method: "GET",
                      credentials: "include",
                      headers: {
                        authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                    }
                  );
                  if (!cancelEmailResponse.ok) {
                    console.error(
                      "Failed to send cancellation email for book",
                      matchedBook._id
                    );
                  }
                } catch (error) {
                  console.error("Error sending cancellation email:", error);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      showAlert("Failed to update order status. Please try again.", "error");
    }
    if (newStatus === "Return") {
      setReturnmessage("your order return , received in 2 day");
    }
  };

  const handleReturnClick = (orderId) => {
    setSelectedOrderId(orderId);
    setShowReturnForm(true);
  };

  const handleReturnCancel = () => {
    setSelectedOrderId(null);
    setShowReturnForm(false);
  };

  const handleRefundClick = (orderId) => {
    setRefundOrderId(orderId);
    setShowRefundForm(true);
  };

  const handleRefundCancel = () => {
    setRefundOrderId(null);
    setShowRefundForm(false);
  };

  const handleRefundSubmit = async (refundData) => {
    // refundData contains refund_method, reason, bank_acc_no, ifsc_code, upi_id, etc.
    try {
      await processRefund(refundOrderId, "", refundData);
      setShowRefundForm(false);
    } catch (error) {
      console.error("Error submitting refund:", error);
      showAlert("Failed to submit refund. Please try again.", "error");
    }
  };

  const handleReturnSubmit = async (formData) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_RENDER_BACK}/api/returnorder`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit return request");
      }

      const orderId = formData.get("order_id");

      // Update order status to 'return-request'
      const statusUpdateResponse = await fetch(
        `${import.meta.env.VITE_RENDER_BACK}/api/${orderId}/Order`,
        {
          method: "PUT",
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ status: "return-request" }),
        }
      );

      if (!statusUpdateResponse.ok) {
        throw new Error("Failed to update order status to return-request");
      }

      // Update order state to reflect new status
      setOrder((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, Order_Status: "return-request" } : order
        )
      );

      setReturnmessage("Your return request has been submitted successfully.");
      setShowReturnForm(false);

    } catch (error) {
      console.error("Error submitting return request:", error);
      showAlert("Failed to submit return request. Please try again.", "error");
    }
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return "";
    const dateObj = new Date(isoDate);
    return `${dateObj.getDate().toString().padStart(2, "0")}-${(
      dateObj.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${dateObj.getFullYear()}`;
  };

  const processRefund = async (orderId, refundreason, refundData = {}) => {
    try {

      const paymentMethod = payments[orderId]; // 'Online' or 'COD'

      const refundBody = {
        reason: refundreason,
        upi_id: refundData.upi_id || "",
        bank_acc_no: refundData.bank_acc_no || "",
        ifsc_code: refundData.ifsc_code || "",
      };

      if (paymentMethod === "COD") {
        if (!refundBody.upi_id && (!refundBody.bank_acc_no || !refundBody.ifsc_code)) {
          showAlert(
            "Please provide UPI ID or Bank details for refund.",
            "error"
          );
          return;
        }
      }

      const response = await fetch(
        `${import.meta.env.VITE_RENDER_BACK}/api/refund/${orderId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify(refundBody),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to process refund");
      }

      showAlert("Refund request submitted successfully.", "success");
    } catch (error) {
      console.error("Error processing refund:", error);
    }
  };

  const sendCancelOrderEmail = async (
    orderId,
    payment_method,
    userEmail,
    orderDetails
  ) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_RENDER_BACK}/cancel-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({
            email: userEmail,
            orderId: orderId,
            orderDetails: orderDetails,
            paymentMethod: payment_method,
          }),
        }
      );

      if (!response.ok) {
        console.error("Failed to send cancellation email");
      }
    } catch (error) {
      console.error("Error sending cancellation email:", error);
    }
  };

  const CancelRefundRoute = async (
    orderId,
    payment_method,
    userEmail,
    orderDetails
  ) => {
    if (payment_method === "COD") {
      await updateOrderStatus(orderId, "Cancelled");
      await sendCancelOrderEmail(orderId, "COD", userEmail, orderDetails);
    } else {
      await updateOrderStatus(orderId, "Cancelled");
      await processRefund(orderId, "User Cancel Order");
     // await sendCancelOrderEmail(orderId, "Razorpay", userEmail, orderDetails);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Shipped":
        return "status-shipped";
      case "Pending":
        return "status-pending";
      case "Cancelled":
        return "status-cancelled";
      case "Delivered":
        return "status-delivered";
      default:
        return "status-default";
    }
  };

  if (loading) {
    return <Load />;
  }

  if (showReturnForm && selectedOrderId) {
    return (
      <>
        <Navbar />
        <div className="orders-container">
          <ReturnOrderForm
            orderId={selectedOrderId}
            onCancel={handleReturnCancel}
            onSubmit={handleReturnSubmit}
            paymentMethod={payments[selectedOrderId]}
          />
        </div>
      </>
    );
  }
  if (showRefundForm && refundOrderId) {
    return (
      <>
        <Navbar />
        <div className="orders-container">
          <RefundPaymentForm
            orderId={refundOrderId}
            onCancel={handleRefundCancel}
            paymentMethod={payments[refundOrderId]}
            onSubmit={handleRefundSubmit}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="orders-container">
        <ProfileMenu />
        <div className="orders-page">
          <div className="orders-header">
            <h1>My Orders</h1>
            <p className="orders-subtitle">Track and manage your orders</p>
          </div>
          <div className="orders-list">
            {order.length > 0 ? (
              order
                .slice()
                .reverse()
                .map((orderItem) => (
                  <div key={orderItem._id} className="order-card">
                    <div className="order-header">
                      <div className="order-info">
                        <div className="order-date">
                          <Calendar size={20} />
                          <span>
                            <b>{formatDate(orderItem.Order_Date)}</b>
                          </span>
                        </div>
                        <div className="order-amount">
                          <CreditCard size={20} />
                          <span>
                            <b>₹{orderItem.Total_Amount}</b>
                          </span>
                        </div>
                        <div className="payment-method">
                          <span>
                            {" "}
                            <SiRazorpay size={20}></SiRazorpay> Payment Method :{" "}
                            <b>{payments[orderItem._id] || "N/A"}</b>
                          </span>
                        </div>
                        {orderItem.Delivery_Date && (
                          <>
                            <div className="delivery-date">
                              <Calendar size={20} />
                              <span>
                                Delivered on :{" "}
                                <b> {formatDate(orderItem.Delivery_Date)}</b>
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      <div
                        className={`my-order-status ${getStatusColor(
                          orderItem.Order_Status
                        )}`}
                      >
                        <Truck size={20} />
                        <span>{orderItem.Order_Status}</span>
                      </div>
                    </div>
                    <div className="order-books">
                      <h3>Ordered Books : {orderItem.books.length}</h3>
                      <div className="book-list">
                        {book
                          .filter(
                            (bookItem, index, self) =>
                              orderItem.books.some(
                                (orderBook) =>
                                  orderBook.book_id === bookItem._id
                              ) &&
                              index ===
                                self.findIndex((b) => b._id === bookItem._id)
                          )
                          .map((bookItem) => {
                            const matchedBook = orderItem.books.find(
                              (orderBook) => orderBook.book_id === bookItem._id
                            );

                            return (
                              <div key={bookItem._id} className="book-card">
                                <div className="book-image">
                                  <img
                                    src={bookItem.BookImageURL}
                                    alt={bookItem.BookName}
                                  />
                                </div>
                                <div className="book-details">
                                  <h4>{bookItem.BookName}</h4>
                                  <p className="book-price">
                                    ₹{bookItem.Price}
                                  </p>
                                  {matchedBook && (
                                    <p className="book-quantity">
                                      Quantity: {matchedBook.book_quantity}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                    {orderItem.Order_Status === "Pending" && (
                      <button
                        onClick={() =>
                          CancelRefundRoute(
                            orderItem._id,
                            payments[orderItem._id],
                            userEmail,
                            orderItem
                          )
                        }
                        className="cancel-order-btn"
                      >
                        Cancel Order
                      </button>
                    )}

                    {orderItem.Order_Status === "Delivered" &&
                      orderItem.books.every((bookdata) => {
                        const matchedBook = book.find(
                          (b) => b._id === bookdata.book_id
                        );
                        return matchedBook?.Isoldbook === false;
                      }) && (
                        <button
                          onClick={() => handleReturnClick(orderItem._id)}
                          className="return-button"
                        >
                          Return Order
                        </button>
                      )}

                    {orderItem.Order_Status === "return-pending" &&
                      (payments[orderItem._id] === "COD" ? (
                        <button
                          className="refund-button"
                          onClick={() => handleRefundClick(orderItem._id)}
                        >
                          Proceed to Refund
                        </button>
                      ) : (
                        <p style={{ color: "orange" }}>
                          Your return request is accepted. Refund will be
                          processed.
                        </p>
                      ))}

                    {orderItem.Order_Status === "return-request" && (
                      <p style={{ color: "green" }}>
                        Your return book request was sent successfully.
                      </p>
                    )}

                    {orderItem.Order_Status === "return-rejected" && (
                      <p style={{ color: "green" }}>
                        Your return book request Rejected.
                      </p>
                    )}

                  </div>
                ))
            ) : (
              <div className="no-orders">
                <Package size={48} />
                <h2>No Orders Yet</h2>
                <p>Start shopping to see your orders here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
