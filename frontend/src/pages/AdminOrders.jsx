import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../pages-css/AdminDashboard.css";
import { useViewOrder } from "../Context/OrderDetail";
import { useAlert } from "../Context/AlertContext";
import Cookies from "js-cookie";
import {formatIndianNumber} from "../utils/formatIndianNumber"



export const AdminOrders = () => {
  const token = Cookies.get("token");
  const [bookdata, setBookdata] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const { setOrderDetails } = useViewOrder();  
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] = useState("delivered"); // New state for active filter

  const handleFilterChange = (status) => {
    setActiveFilter(status);
  };

  useEffect(() => {
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
        setUsers(json.users); // Initialize with all users
      } catch (error) {
        showAlert("An error occurred. Please try again later.", "error");
        console.error(error);
      }
    };
    GetUsers();

    const fetchBook = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/Book`, {
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        setBookdata(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchBook();
  }, []);

  const viewOrder = (orderdata, bookdata) => {
    let userdata = users.find((data) => data._id === orderdata.User_id);
    if (!userdata) {
      userdata = { First_name: "Unknown", Last_name: "User" };
    }

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



  return (
    <section className="data-table">
      <h2>Orders</h2>
      <div className="stats-container">
        <p 
          className={`filter-btn ${activeFilter === "delivered" ? "active" : ""}`} 
          onClick={() => handleFilterChange("delivered")}
        >
          Delivered
        </p>
        <p 
          className={`filter-btn ${activeFilter === "shipped" ? "active" : ""}`} 
          onClick={() => handleFilterChange("shipped")}
        >
          Shipped
        </p>
        <p 
          className={`filter-btn ${activeFilter === "cancelled" ? "active" : ""}`} 
          onClick={() => handleFilterChange("cancelled")}
        >
          Cancelled
        </p>
        <p 
          className={`filter-btn ${activeFilter === "returned" ? "active" : ""}`} 
          onClick={() => handleFilterChange("returned")}
        >
          Returned
        </p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Status</th>
            <th>Amount</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders
            .filter((order) => {
              return activeFilter === "all" || order.Order_Status.toLowerCase() === activeFilter;
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
                </tr>
              );
            })}
        </tbody>
      </table>
    </section>
  );
};
