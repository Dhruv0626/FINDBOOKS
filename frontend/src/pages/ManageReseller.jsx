import React, { useEffect, useState } from "react";
import "../pages-css/ManageReseller.css";
import Cookies from "js-cookie";
import { useAlert } from "../Context/AlertContext";

const ManageResellers = () => {
  const token = Cookies.get("token");
  const [resellers, setResellers] = useState([]);
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [filteredReseller, setFilteredReseller] = useState([]);
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchResellers();
  }, []);

  const fetchResellers = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_RENDER_BACK}/api/resellerbook`,
        {
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      setResellers(data.resellers);
      setBooks(data.books);
    } catch (error) {
      console.error("Error fetching resellers:", error);
    }
  };

  useEffect(() => {
    if (search.trim() === "") {
      setFilteredReseller(resellers);
    } else {
      setFilteredReseller(
        resellers.filter(
          (reseller) =>
            reseller.User_id?.First_name.toLowerCase().includes(
              search.toLowerCase()
            ) ||
            reseller.User_id?.Last_name.toLowerCase().includes(
              search.toLowerCase()
            )
        )
      );
    }
  }, [search, resellers]);

  const addpaymentdata = async (reseller_id, price, email) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_RENDER_BACK}/api/${"debit"}/codpayment`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            order_id: reseller_id,
            payment_method: "Razorpay",
            payment_status: "Completed",
            total_payment: price,
          }),
          credentials: "include",
        }
      );
      if (!response.ok) {
        throw new Error("Failed to store payment data");
      }

      // After successful codpayment, call PUT /SellOrders to update payment status
      const sellOrderResponse = await fetch(
        `${import.meta.env.VITE_BACK_URL}/api/SellOrders`,
        {
          method: "PUT",
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resellerid: reseller_id,
            payment: "Completed",
            bookid: null,
            status: "Completed",
          }),
          credentials: "include",
        }
      );
      if (!sellOrderResponse.ok) {
        console.error("Failed to update SellOrders payment status");
      } else {
        // Update local reseller state to reflect payment and status change
        setResellers((prevResellers) =>
          prevResellers.map((reseller) =>
            reseller._id === reseller_id
              ? { ...reseller, Resell_Status: "Completed", Payment: "Completed" }
              : reseller
          )
        );
      }

      showAlert("payment Successfull","success");

      if (!email || !price) {
        console.error("Invalid email or amount for reseller payment email");
      } else {
        const emailResponse = await fetch(
          `${import.meta.env.VITE_RENDER_BACK}/api/send-reseller-payment-email`,
          {
            method: "POST",
            headers: {
              authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: email,
              amount: price.toString(),
            }),
          }
        );
        if (!emailResponse.ok) {
          console.error("Failed to send reseller payment email");
        }

              showAlert("reseller payment email send","success");
      }
    } catch (error) {
      console.error("Error store paymentdata:", error);
    }
  };

  // Create a map from Book_id to book price for quick lookup
  const bookPriceMap = {};
  books.forEach((book) => {
    bookPriceMap[book._id] = book.Price;
  });

  return (
    <div className="resellers-page">
      <h2 className="title">Manage Resellers</h2>
      <input
        type="text"
        placeholder="Search by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-bar"
      />
      <div className="resellers-card">
        <table className="resellers-table">
          <thead>
            <tr>
              <th>Reseller Name</th>
              <th>Book ID</th>
              <th>Total Payment</th>
              <th>Payable Amount</th>
              <th>Address</th>
              <th>UPI ID</th>
              <th>Bank Account No</th>
              <th>IFSC Code</th>
              <th>Status</th>
              <th>Delivery User ID</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredReseller.map((reseller) => (
              <tr key={reseller._id}>
                <td>
                  {reseller.User_id
                    ? `${reseller.User_id.First_name} ${reseller.User_id.Last_name}`
                    : "N/A"}
                </td>
                <td>{reseller.Book_id}</td>
                <td>
                  {bookPriceMap[reseller.Book_id] !== undefined
                    ? bookPriceMap[reseller.Book_id].toFixed(2)
                    : "N/A"}
                </td>
                <td>
                  {bookPriceMap[reseller.Book_id] !== undefined
                    ? (bookPriceMap[reseller.Book_id] * 0.9).toFixed(2)
                    : "N/A"}
                </td>
                <td>{reseller.address}</td>
                <td>{reseller.upi_id ? reseller.upi_id : "N/A"}</td>
                <td>
                  {!reseller.upi_id ? reseller.bank_acc_no || "N/A" : "-"}
                </td>
                <td>{!reseller.upi_id ? reseller.ifsc_code || "N/A" : "-"}</td>
                <td>{reseller.Resell_Status}</td>
                <td>{reseller.Delivery_User_id || "N/A"}</td>
                <td>
                  {(reseller.Resell_Status === "Collected" && reseller.Payment === "Pending") ? (
                  <button
                    className="pay-button"
                    onClick={() =>
                      addpaymentdata(reseller._id, bookPriceMap[reseller.Book_id] * 0.9, reseller.User_id?.Email || "")
                    }
                  >
                    Pay
                  </button>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageResellers;
