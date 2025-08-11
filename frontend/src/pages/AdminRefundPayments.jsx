import React, { useEffect, useState } from "react";
import { AdminRoute } from "./AdminDashboard";
import "../pages-css/AdminRefundPayments.css";
import Cookies from "js-cookie";
import { useAlert } from "../Context/AlertContext";


const AdminRefundPayments = () => {
  const token = Cookies.get("token");
  const [refundPayments, setRefundPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { showAlert } = useAlert();

  // ✅ Fetch refund payments on load
  useEffect(() => {
    const fetchRefundPayments = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_RENDER_BACK}/api/refunds`,
          {
            credentials: "include",
            headers: {
              authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const data = await response.json();

        if (data && data.refundPayment && Array.isArray(data.refundPayment)) {
          setRefundPayments(data.refundPayment);
        } else {
          setRefundPayments([]);
        }
      } catch (error) {
        showAlert("Failed to fetch refund payments. Please try again later.","error");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchRefundPayments();
  }, []);

  // ✅ Handle refund approval
  const handleRefundApproval = async (refundId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_RENDER_BACK}/api/refund/${refundId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({ refund_status: "Completed" }),
        }
      );

      if (response.ok) {
        // Update status in frontend list
        setRefundPayments((prev) =>
          prev.map((item) =>
            item._id === refundId
              ? { ...item, refund_status: "Completed" }
              : item
          )
        );
        showAlert("Refund marked as Completed.","success");
      } else {
        showAlert("Failed to update refund status.","error");
      }
    } catch (error) {
      console.error("Error updating refund status:", error);
      showAlert("Something went wrong while updating.","error");
    }
  };

  // ✅ Filter refund list based on search input
  const filteredPayments = refundPayments.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      (item.payment_id && item.payment_id.toLowerCase().includes(query)) ||
      (item.refund_status && item.refund_status.toLowerCase().includes(query)) ||
      (item.order_status && item.order_status.toLowerCase().includes(query)) ||
      (item.bank_acc_no && item.bank_acc_no.toLowerCase().includes(query)) ||
      (item.ifsc_code && item.ifsc_code.toLowerCase().includes(query)) ||
      (item.user_name && item.user_name.toLowerCase().includes(query)) ||
      (item.reason && item.reason.toLowerCase().includes(query))
    );
  });

  return (
    <AdminRoute>
      <br />
      <div className="payments-container">
        <h2>Refund Payments</h2>
        <input
          type="text"
          placeholder="Search refund payments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="refundsearch-input"
          style={{
            marginBottom: "1rem",
            padding: "0.5rem",
            width: "100%",
            maxWidth: "400px",
          }}
        />

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="table-wrapper">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Refund Date</th>
                  <th>Refund Status</th>
                  <th>User</th>
                  <th>Reason</th>
                  <th>Total_Payment</th>
                  <th>Razorpay_refund_id</th>
                  <th>UPI ID</th>
                  <th>Bank Acc No</th>
                  <th>IFSC Code</th>
                  <th>Refund Method</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan="11" style={{ textAlign: "center" }}>
                      No refund payments found.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((item) => (
                    <tr key={item._id}>
                      <td>{item.payment_id}</td>
                      <td>
                        {item.refund_date
                          ? new Date(item.refund_date).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td>{item.refund_status}</td>
                      <td>{item.user_name || "N/A"}</td>
                      <td>{item.reason || "N/A"}</td>
                      <td>₹{Number(item.total_payment || 0).toFixed(2)}</td>
                      <td>{item.razorpay_refund_id || "-"}</td>
                      <td>{item.upi_id || "N/A"}</td>
                      <td>{item.bank_acc_no || "N/A"}</td>
                      <td>{item.ifsc_code || "N/A"}</td>
                      <td>{item.refund_method || "N/A"}</td>
                      <td>
                        {item.refund_status === "Pending" && (
                          <button
                            className="process-refund-btn"
                            onClick={() => handleRefundApproval(item._id)}
                          >
                            Pay
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminRoute>
  );
};

export default AdminRefundPayments;
