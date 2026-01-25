import React, { useState, useEffect } from "react";
import "../pages-css/DeliveryDashboard.css";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../Context/AdminContext";
import Load from "../components/Load";
import { useAlert } from "../Context/AlertContext";
import Cookies from "js-cookie";
import {formatIndianNumber} from "../utils/formatIndianNumber"


const DeliverypersonRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Load />;
  }

  if (!user) {
    // Remove navigation to /adminlogin by redirecting to home or login page instead
    return <Navigate to="/login" />;
  }

  return children;
};

const DeliveryDashboard = () => {
  const token = Cookies.get("token");

  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState([]);
  const [payment, setPayment] = useState([]);
  const [deliveryperson, setDeliveryperson] = useState(null);
  const [activeSection, setActiveSection] = useState("completedDeliveries");
  const [reseller, setReseller] = useState([]);
  const [books, setBooks] = useState([]);
  const [reselluser, setReselluser] = useState([]);

  const [ordersLoading, setOrdersLoading] = useState(true);
  const [sellLoading, setSellLoading] = useState(true);
  const loading = ordersLoading || sellLoading;

  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const updateStatus = (order) => {
    navigate("/deliverydashboard/deliverydetail", {
      state: { order, user, payment },
    });
  };

  const resellupdateStatus = (resellerdata) => {
    navigate("/deliverydashboard/reselldeliverydetail", {
      state: { resellerdata, books, reselluser },
    });
  };

  const updateReturnCollectionStatus = (order) => {
    navigate("/deliverydashboard/returnbookdetail", { state: { order, user, payment } });
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
        setOrders(json.orders || []);
        setUser(json.user || []);
        setPayment(json.payment || []);
        setDeliveryperson(json.delivery);
      } catch (error) {
        showAlert("An error occurred while fetching orders.", "error");
        console.error(error);
      } finally {
        setOrdersLoading(false);
      }
    };

    const getSellOrder = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/SellOrder`, {
          credentials: "include",
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const json = await response.json();
        setBooks(Array.isArray(json.books) ? json.books : []);
        setReseller(Array.isArray(json.reseller) ? json.reseller : []);
        setReselluser(Array.isArray(json.users) ? json.users : []);
        setDeliveryperson(json.delivery);
      } catch (error) {
        showAlert("An error occurred while fetching reseller data.", "error");
        console.error("Error fetching SellOrder data:", error);
      } finally {
        setSellLoading(false);
      }
    };

    getOrders();
    getSellOrder();
  }, []);

  const sectionNames = {
    completedDeliveries: "Completed Deliveries",
    completedBookCollected: "Collected Books",
    pendingDeliveries: "Pending Deliveries",
    pendingBookCollection: "Pending Book Collections",
    returnCollection: "Return Collection",
  };

  const sectionFilters = {
    completedDeliveries: deliveryperson
      ? orders.filter(
          (order) =>
            order.Order_Status === "Delivered" &&
            order.Delivery_User_id === deliveryperson
        )
      : [],
    completedBookCollected: deliveryperson
      ? reseller.filter(
          (order) =>
            order.Resell_Status === "Collected" &&
            order.Delivery_User_id === deliveryperson
        )
      : [],
    pendingDeliveries: orders.filter(
      (order) => order.Order_Status === "Shipped"
    ),
    pendingBookCollection: reseller.filter(
      (order) => order.Resell_Status === "Sell"
    ),
    returnCollection: orders.filter(
      (order) => order.Order_Status === "return-pending"
    ),
  };

  if (loading) return <Load />;

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Delivery Dashboard</h1>
      <div className="deliverystats-container">
        {Object.keys(sectionFilters).map((section) => (
          <p
            key={section}
            className={activeSection === section ? "active" : ""}
            onClick={() => setActiveSection(section)}
          >
            {sectionNames[section]}
          </p>
        ))}
      </div>

      <div className="totalorders-container">
        <h2 className="orders-title">{sectionNames[activeSection]}</h2>
        <table className="orders-table">
          <thead>
            <tr>
              {activeSection === "pendingBookCollection" ||
              activeSection === "completedBookCollected" ? (
                <>
                  <th>User</th>
                  <th>Reseller Address</th>
                  <th>Resell Status</th>
                  {(activeSection.includes("pending") ||
                    activeSection === "returnCollection") && <th>Actions</th>}
                </>
              ) : activeSection === "returnCollection" ? (
                <>
                  <th>Order ID</th>
                  <th>Delivery Address</th>
                  <th>Status</th>
                  <th>Amount</th>
                  {(activeSection.includes("pending") ||
                    activeSection === "returnCollection") && <th>Actions</th>}
                </>
              ) : (
                <>
                  <th>Order ID</th>
                  <th>Delivery Address</th>
                  <th>Status</th>
                  <th>Amount</th>
                  {activeSection.includes("pending") && <th>Actions</th>}
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {sectionFilters[activeSection].map((item) => (
              <tr key={item._id}>
                {activeSection === "pendingBookCollection" ||
                activeSection === "completedBookCollected" ? (
                  <>
                    <td>
                      {typeof item.User_id === "object" && item.User_id !== null
                        ? `${item.User_id.First_name} ${item.User_id.Last_name}`
                        : item.User_id}
                    </td>
                    <td>{item.address || "N/A"}</td>
                    <td>{item.Resell_Status}</td>
                    {activeSection.includes("pending") && (
                      <td>
                        <button
                          onClick={() => resellupdateStatus(item)}
                          className="deliveryaction-button"
                        >
                          Start
                        </button>
                      </td>
                    )}
                  </>
                ) : activeSection === "returnCollection" ? (
                  <>
                    <td>{item._id}</td>
                    <td>{item.Address || "N/A"}</td>
                    <td>{item.Order_Status}</td>
                    <td>₹{formatIndianNumber(item.Total_Amount) || "0.00"}</td>
                    {activeSection === "returnCollection" && (
                      <td>
                        <button
                          onClick={() => updateReturnCollectionStatus(item)}
                          className="deliveryaction-button"
                        >
                          Start Return Collection
                        </button>
                      </td>
                    )}
                  </>
                ) : (
                  <>
                    <td>{item._id}</td>
                    <td>{item.Address || "N/A"}</td>
                    <td>{item.Order_Status}</td>
                    <td>₹{formatIndianNumber(item.Total_Amount) || "0.00"}</td>
                    {activeSection.includes("pending") && (
                      <td>
                        <button
                          onClick={() => updateStatus(item)}
                          className="deliveryaction-button"
                        >
                          Start Delivery
                        </button>
                      </td>
                    )}
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export { DeliveryDashboard, DeliverypersonRoute };
