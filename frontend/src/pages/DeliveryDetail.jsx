import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../pages-css/DeliveryDetail.css";
import { useAlert } from "../Context/AlertContext";
import Cookies from "js-cookie";


export const DeliveryDetail = () => {
  const token = Cookies.get("token");
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [timer, setTimer] = useState(60);
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [deliveryCompleted, setDeliveryCompleted] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false); // NEW STATE
  const { showAlert } = useAlert();

  const { order = {}, user = [], payment = [] } = location.state || {};
  const userdetail = user.find((u) => u._id === order.User_id) || {};
  const paymentdetail = payment.filter((p) => p.order_id === order._id);
  const email = userdetail.Email || "";

  useEffect(() => {
    let countdown;
    if (otpSent && timer > 0) {
      countdown = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      clearInterval(countdown);
      setOtpSent(false);
    }
    return () => clearInterval(countdown);
  }, [otpSent, timer]);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSendOtp = async () => {
    if (!isValidEmail(email)) {
      showAlert("Please enter a valid email address.", "error");
      return;
    }

    setSendingOtp(true); // START loading
    try {
      const res = await fetch(
        `${import.meta.env.VITE_RENDER_BACK}/api/deliverydetail/forgot-password`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      if (res.ok) {
        setStep(2);
        setOtpSent(true);
        setTimer(60);
        showAlert("OTP sent successfully", "success");
      } else {
        showAlert("Failed to send OTP. Please try again.", "error");
      }
    } catch (error) {
      showAlert("Error sending OTP. Check your internet connection.", "error");
    } finally {
      setSendingOtp(false); // STOP loading
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/verify-otp`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
      });

      if (res.ok) {
        setVerified(true);
        setStep(3);
      } else {
        showAlert("Invalid OTP. Please try again.", "error");
      }
    } catch (error) {
      showAlert("Error verifying OTP. Please check your connection.", "error");
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/resend-otp`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setOtpSent(true);
        setTimer(60);
        showAlert("OTP resent successfully", "success");
      } else {
        showAlert("Failed to resend OTP. Try again.", "error");
      }
    } catch (error) {
      showAlert("Error resending OTP.", "error");
    }
  };

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
          body: JSON.stringify({ status: newStatus, userdetail, payment_date: new Date() }),
        }
      );

      if (!response.ok) throw new Error("Failed to update order status");

      showAlert("Order marked as Delivered!", "success");
      setDeliveryCompleted(true);
    } catch (error) {
      showAlert("Failed to update order status. Please try again.", "error");
    }

    if (paymentdetail[0].payment_method === "COD") {
      try {
        const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/codpayment`, {
          method: "PUT",
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentid: paymentdetail[0]._id,
            payment_status: "Completed",
            payment_date: new Date(),
          }),
          credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to update quantity");
      } catch (error) {
        console.error("Error updating quantity:", error);
        showAlert("An error occurred while updating the quantity", "error");
      }
    }
  };

  return (
    <div className="delivery-process-container">
      <h1>Delivery Process</h1>

      <div className="order-details">
        <h2>Customer Details</h2>
        <p className="custom-p-delivery">
          <strong>Name:</strong>{" "}
          {userdetail.First_name
            ? `${userdetail.First_name} ${userdetail.Last_name}`
            : "N/A"}
        </p>
        <p className="custom-p-delivery">
          <strong>Phone:</strong> {userdetail.Phone_no || "N/A"}
        </p>
        <p className="custom-p-delivery">
          <strong>Email Id:</strong> {userdetail.Email || "N/A"}
        </p>
      </div>

      <div className="order-details">
        <h2>Order Details</h2>
        <p className="custom-p-delivery"><strong>Order Id :</strong> {order._id || "N/A"}</p>
        <p className="custom-p-delivery"><strong>Address :</strong> {order.Address || "N/A"}</p>
        <p className="custom-p-delivery"><strong>Status:</strong> {order.Order_Status || "N/A"}</p>
        <p className="custom-p-delivery"><strong>Amount:</strong> {order.Total_Amount || "0.00"}</p>
      </div>

      <div className="order-details">
        <h2>Payment Details</h2>
        <p className="custom-p-delivery">
          <strong>Payment Mode:</strong>{" "}
          {paymentdetail.length > 0 ? paymentdetail[0].payment_method : "N/A"}
        </p>
      </div>

      {!deliveryCompleted ? (
        <div className="otp-section">
          <h2>OTP Verification</h2>
          <p>
            OTP Sent to Customer Email: <b>{email || "N/A"}</b>
          </p>
          <br />

          {step === 1 && (
            <button
              onClick={handleSendOtp}
              disabled={!isValidEmail(email) || sendingOtp}
              className="submit-button"
            >
              {sendingOtp ? "Sending..." : "Send OTP"}
            </button>
          )}

          {step === 2 && !verified && (
            <div className="otp-container">
              <p className="otp-label">Enter OTP</p>
              <input
                type="text"
                className="otp-input"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <div>
                <button className="submit-button" onClick={handleVerifyOtp}>
                  Verify OTP
                </button>
                <br />
                <button
                  className="submit-button"
                  onClick={handleResendOtp}
                  disabled={timer > 0}
                >
                  Resend OTP {timer > 0 && `(${timer}s)`}
                </button>
              </div>
            </div>
          )}

          {verified && (
            <div className="otp-success">
              <p className="success-message">OTP Verified Successfully!</p>
              <button
                className="submit-button"
                onClick={() => updateOrderStatus(order._id, "Delivered")}
              >
                Complete Delivery
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="delivery-confirmation">
          <h2>Delivery Completed</h2>
          <p className="success-message">
            The order has been successfully delivered.
          </p>
        </div>
      )}
    </div>
  );
};
