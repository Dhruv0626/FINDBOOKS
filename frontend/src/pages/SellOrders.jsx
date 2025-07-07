import React, { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import "../pages-css/SellOrder.css";
import { ProfileMenu } from "../components/ProfileMenu";
import { Package, Calendar, CreditCard, Truck, XCircle } from "lucide-react";
import Load from "../components/Load";
import { useAlert } from "../Context/AlertContext";
import Cookies from "js-cookie";
import {formatIndianNumber} from "../utils/formatIndianNumber"


export const SellOrders = () => {
  const token = Cookies.get("token");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reseller, setReseller] = useState([]);
  const { showAlert } = useAlert();


  useEffect(() => {
    const getSellOrder = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/SellOrders`, {
          credentials: "include",
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const json = await response.json();
        const books = Array.isArray(json.books) ? json.books : [];
        const resellerdata = Array.isArray(json.resellerdata) ? json.resellerdata : [];
        setBooks(books);
        setReseller(resellerdata)
      } catch (error) {
        console.error("Error fetching SellOrder data:", error);
      } finally {
        setLoading(false);
      }
    };

    getSellOrder();
  }, []);


 const updatestatus = async (resellerid, bookid) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/Book`, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bookId: bookid }),
      credentials: 'include',
    });

    if (!response.ok) {
      showAlert("Book not deleted", "error");
      return;
    }

    // Remove book from UI
    setBooks(prev => prev.filter(book => book._id !== bookid));
  } catch (error) {
    console.error("Error deleting book:", error);
    showAlert("An error occurred while deleting the book", "error");
    return;
  }

  setTimeout(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/ResellerPaymentForm/${resellerid}`, {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resellerid }),
        credentials: 'include',
      });

      if (!response.ok) {
        showAlert("Reseller not deleted", "error");
        return;
      }

      // Remove reseller from UI
      setReseller(prev => prev.filter(r => r._id !== resellerid));

      showAlert("Your sell order has been removed", "success");
    } catch (error) {
      console.error("Error deleting reseller:", error);
      showAlert("An error occurred while deleting the reseller", "error");
    }
  }, 1000);
};

  const formatDate = (isoDate) => {
    if (!isoDate) return "";
    const dateObj = new Date(isoDate);
    return `${dateObj.getDate().toString().padStart(2, "0")}-${(dateObj.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${dateObj.getFullYear()}`;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "sold":
        return "status-sold";
      case "pending":
        return "status-pending";
      case "cancelled":
        return "status-cancelled";
      default:
        return "status-default";
    }
  };

  if (loading) {
    return <Load />;
  }

  return (
    <>
      <Navbar />
      <div className="sell-orders-container">
        <ProfileMenu />
        <div className="sell-orders-page">
          <div className="sell-orders-header">
            <h1>My Sell Orders</h1>
            <p className="sell-orders-subtitle">Track and manage your book sales</p>
          </div>
          <div className="sell-orders-list">
            {reseller && reseller.length > 0 ? (
              reseller.map((reseller) => (
                <div key={reseller._id} className="sell-order-card">
                  <div className="order-header">
                    <div className="order-info">
                      {books
                        .filter((data) => reseller.Book_id === data._id)
                        .map((bookdata) => (
                          <div key={bookdata._id}>
                            <div className="order-date">
                              <span>Added At</span>
                              <Calendar size={20} />
                              <span><b>{bookdata.createdAt ? formatDate(bookdata.createdAt) : "N/A"}</b></span><br></br>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    <div className={`sell-order-status ${getStatusColor(reseller.Resell_Status)}`}>
                      <Truck size={20} />
                      <span>{reseller.Resell_Status || "Pending"}</span>
                    </div>
                  </div>


                  <div className="order-books">
                    <h3>Book Details</h3>
                    {books
                      .filter((data) => reseller.Book_id === data._id)
                      .map((bookdata) => (
                        <div key={bookdata._id}>
                          <div className="book-list">
                            <div className="book-card">
                              <div className="book-image">
                                <img
                                  src={bookdata.BookImageURL}
                                  alt={bookdata.BookName}
                                />
                              </div>
                              <div className="book-details">
                                <h4>{bookdata.BookName}</h4>
                                <p className="book-price">₹{formatIndianNumber(bookdata.Price)}</p>
                                <p className="book-quantity">Quantity: {bookdata.Quantity || 1}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    }
                    <br/>
                    <p>Reseller Address : <b>{reseller.address}</b></p>
                    <br/>
                    {reseller.Resell_Status === "Pending" ? (
                      <button onClick={() => updatestatus(reseller._id, reseller.Book_id)} className="cancel-sell-book">
                        Cancel Sell Book
                      </button>
                    ) : ""}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-orders">
                <Package size={48} />
                <h2>No Sell Orders Yet</h2>
                <p>Start selling books to see your orders here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

}; 