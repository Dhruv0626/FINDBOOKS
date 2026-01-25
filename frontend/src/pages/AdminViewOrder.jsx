import React, { useEffect } from "react";
import "../pages-css/AdminViewOrder.css";
import { useViewOrder } from "../Context/OrderDetail";
import { useNavigate } from "react-router-dom";
import {formatIndianNumber} from "../utils/formatIndianNumber"


export const AdminViewOrder = () => {
  const { orderDetails } = useViewOrder();
  const navigate = useNavigate();

  useEffect(() => {
    if (!orderDetails) {
      navigate("/Admin");
    }
  }, [orderDetails, navigate]);

  if (!orderDetails) {
    return null; // Prevents rendering anything before redirect
  }

  const { orderdata, userdata, bookdata } = orderDetails;

  // Function to format date as DD-MM-YYYY
  const formatDate = (isoDate) => {
    if (!isoDate) return "";
    const dateObj = new Date(isoDate);
    return `${dateObj.getDate().toString().padStart(2, "0")}-${(dateObj.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${dateObj.getFullYear()}`;
  };

  return (
    <div className="view-order-container">
      <h2 className="title">Order Details</h2>
      <div className="order-card">
        <p>
          <strong>Order ID :</strong> {orderdata._id}
        </p>
        <p>
         <strong>Customer :</strong> {`${userdata.First_name} ${userdata.Last_name}`}
        </p>
        <p>
          <strong>Email : </strong> {userdata.Email}
        </p>
        <p>
          <strong>Mobile :</strong> {userdata.Phone_no}
        </p>
        <p>
          <strong>Address :</strong> {orderdata.Address}
        </p>
        <p>
          <strong>Date :</strong> {formatDate(orderdata.Order_Date)}
        </p>
        <p>
          <strong>Total Amount :</strong> ₹{formatIndianNumber(orderdata.Total_Amount)}
        </p>
        <p>
          <strong>Status :</strong> {orderdata.Order_Status}
        </p>
      </div>

      <h3 className="subtitle">Order Items</h3>
      <table className="order-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Quantity</th>
            <th>New/Resell</th>
            <th>Price</th>
            <th>Total Price</th>
          </tr>
        </thead>
        <tbody>
          {bookdata.map((item) => (
            <tr key={item._id}>
              <td>{item.BookName}</td>
              <td>{item.book_quantity}</td>
              <td>{item.Isoldbook === true ? "Resell" : "New"}</td>
              <td>₹{formatIndianNumber(item.Price)}</td>
              <td>₹{formatIndianNumber(item.Price * item.book_quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
