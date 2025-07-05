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
  const [loadingOrderId, setLoadingOrderId] = useState(null);

  const { showAlert } = useAlert();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReturnOrders = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACK_URL}/api/returnorder`,
          {
            credentials: "include",
            headers: {
              authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch return orders");
        }
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

  const handleStatusUpdate = async (id, status, orderId) => {
    try {
      setLoadingOrderId(id); // Start loading for this order

      // 1. Update return order status
      const response = await fetch(
        `${import.meta.env.VITE_BACK_URL}/api/returnorder/${id}`,
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

      if (!response.ok) throw new Error("Failed to update return order status");
      const updatedReturnOrder = await response.json();

      // 2. Update main order status
      const orderStatus =
        status === "Approved"
          ? "return-pending"
          : status === "Rejected"
          ? "request-rejected"
          : null;

      if (orderStatus && orderId) {
        const orderUpdateResponse = await fetch(
          `${import.meta.env.VITE_BACK_URL}/api/${orderId}/Order`,
          {
            method: "PUT",
            headers: {
              authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ status: orderStatus }),
          }
        );
        if (!orderUpdateResponse.ok) {
          throw new Error("Failed to update main order status");
        }
      }

      // 3. Update UI
      setReturnOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === id ? updatedReturnOrder : order
        )
      );


      showAlert(`Return order status updated to ${status}`, "success");
    } catch (error) {
      console.error(error);
      showAlert("Failed to update return order status", "error");
    } finally {
      setLoadingOrderId(null); // Stop loading
    }
  };

  if (loading) {
    return <Load />;
  }

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
              <th>Image </th>
              <th>Additional Info</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {returnOrders.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  No return orders found.
                </td>
              </tr>
            ) : (
              returnOrders.map((order) => (
                <tr key={order._id}>
                  <td>{order.order_id}</td>
                  <td>{`${order.userFirstName || ""} ${
                    order.userLastName || ""
                  }`}</td>
                  <td>{order.reason}</td>
                  <td>
                    {order.image_url ? (
                      <img
                        src={`http://localhost:2606/${order.image_url}`}
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
                              order.order_id
                            )
                          }
                          disabled={loadingOrderId === order._id}
                        >
                          {loadingOrderId === order._id
                            ? "Accepting..."
                            : "Accept"}
                        </button>

                        <button
                          className="reject-button"
                          onClick={() =>
                            handleStatusUpdate(
                              order._id,
                              "Rejected",
                              order.order_id
                            )
                          }
                        >
                          Reject
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
