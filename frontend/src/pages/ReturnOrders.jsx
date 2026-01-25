import React, { useEffect, useState } from "react";
import { Navbar } from "../components/Navbar";
import { ProfileMenu } from "../components/ProfileMenu";
import "../pages-css/ReturnOrders.css";
import Load from "../components/Load";
import { useAlert } from "../Context/AlertContext";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

const ReturnOrders = () => {
  const token = Cookies.get("token");
  const [returnOrders, setReturnOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingButton, setLoadingButton] = useState({
    orderId: null,
    action: null,
  });

  const { showAlert } = useAlert();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReturnOrders = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_RENDER_BACK}/api/returnorder`,
          {
            credentials: "include",
            headers: {
              authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch return orders");

        const data = await response.json();
        setReturnOrders(data);
      } catch (error) {
        showAlert("Failed to load return orders", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchReturnOrders();
  }, [navigate, showAlert]);

  const handleStatusUpdate = async (id, status, orderId, action) => {
    setLoadingButton({ orderId: id, action });

    try {
      // 1. Update return order status
      const res1 = await fetch(
        `${import.meta.env.VITE_RENDER_BACK}/api/returnorder/${id}`,
        {
          method: "PUT",
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ status }),
        }
      );

      if (!res1.ok) {
        const msg = await res1.text();
        throw new Error("Failed to update return order status: " + msg);
      }

      const updatedReturnOrder = await res1.json();

      // 2. If Approved or Rejected, update original order status
      const newStatus =
        status === "Approved"
          ? "return-pending"
          : status === "Rejected"
          ? "request-rejected"
          : null;

      if (orderId && newStatus) {
        const res2 = await fetch(
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

        if (!res2.ok) {
          const msg = await res2.text();
          throw new Error("Failed to update main order status: " + msg);
        }
      }

      // 3. Update UI
      setReturnOrders((prev) =>
        prev.map((order) => (order._id === id ? updatedReturnOrder : order))
      );

      showAlert(`Return order status updated to ${status}`, "success");
    } catch (error) {
      console.error(error);
      showAlert(error.message || "Failed to update return order", "error");
    } finally {
      setLoadingButton({ orderId: null, action: null });
    }
  };

  if (loading) return <Load />;

  return (
    <div className="return-orders-page">
      <h1>Return Orders</h1>
      <div className="table-responsive">
        <table className="return-orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>User Name</th>
              <th>Reason</th>
              <th>Image</th>
              <th>Additional Info</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {returnOrders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                  No return orders found.
                </td>
              </tr>
            ) : (
              returnOrders.map((order) => (
                <tr key={order._id}>
                  <td>{order.order_id}</td>
                  <td>{`${order.userFirstName || ""} ${order.userLastName || ""}`}</td>
                  <td>{order.reason}</td>
                  <td>
                    {order.image_url ? (
                      <img
                        src={order.image_url}
                        alt={order.order_id}
                        className="image"
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>{order.additional_info || "-"}</td>
                  <td>{order.status}</td>
                  <td className="action-buttons">
                    {order.status === "Pending" ? (
                      <>
                        <button
                          className="accept-button"
                          onClick={() =>
                            handleStatusUpdate(
                              order._id,
                              "Approved",
                              order.order_id,
                              "accept"
                            )
                          }
                          disabled={
                            loadingButton.orderId === order._id &&
                            loadingButton.action === "accept"
                          }
                        >
                          {loadingButton.orderId === order._id &&
                          loadingButton.action === "accept"
                            ? "Accepting..."
                            : "Accept"}
                        </button>

                        <button
                          className="reject-button"
                          onClick={() =>
                            handleStatusUpdate(
                              order._id,
                              "Rejected",
                              order.order_id,
                              "reject"
                            )
                          }
                          disabled={
                            loadingButton.orderId === order._id &&
                            loadingButton.action === "reject"
                          }
                        >
                          {loadingButton.orderId === order._id &&
                          loadingButton.action === "reject"
                            ? "Rejecting..."
                            : "Reject"}
                        </button>
                      </>
                    ) : (
                      <span>{order.status}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReturnOrders;
