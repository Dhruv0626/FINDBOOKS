import React, { useState } from "react";
import "../pages-css/PaymentForm.css";
import { useNavigate } from "react-router-dom";
import { useAlert } from "../Context/AlertContext";

export const PaymentForm = () => {
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [onlinePaymentMethod, setOnlinePaymentMethod] = useState("upi");
  const Navigate = useNavigate();
  const { showAlert } = useAlert();

  const [formData, setFormData] = useState({
    upiId: "",
    qrCodeScanned: false,
    bankAccount: "",
    ifscCode: "",
  });

  const handlePaymentChange = (e) => {
    setPaymentMethod(e.target.value);
  };

  const handleOnlinePaymentChange = (e) => {
    setOnlinePaymentMethod(e.target.value);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleScanQR = () => {
    setFormData((prevData) => ({
      ...prevData,
      qrCodeScanned: true,
    }));
    useAlert("QR Code Scanned Successfully!","success");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (paymentMethod === "online") {
      if (onlinePaymentMethod === "upi" && !formData.upiId) {
        showAlert("Please enter your UPI ID.","error");
        return;
      }
      if (onlinePaymentMethod === "qr" && !formData.qrCodeScanned) {
        showAlert("Please scan the QR code.","error");
        return;
      }
      if (
        onlinePaymentMethod === "bank" &&
        (!formData.bankAccount || !formData.ifscCode)
      ) {
        showAlert("Please fill in bank account details.","error");
        return;
      }
    }

   
    showAlert("Payment Successful!","error");
  };

  const Order = () => {
    Navigate("");
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <h2>Payment Details</h2>

      {/* Payment Method Selection */}
      <div className="form-group">
        <label>Payment Method:</label>
        <div className="payment-options">
          <label>
            <input
              type="radio"
              name="paymentMethod"
              value="online"
              checked={paymentMethod === "online"}
              onChange={handlePaymentChange}
            />
            Online Payment
          </label>
          <label>
            <input
              type="radio"
              name="paymentMethod"
              value="cod"
              checked={paymentMethod === "cod"}
              onChange={handlePaymentChange}
            />
            Cash on Delivery
          </label>
        </div>
      </div>

      {/* Online Payment Options */}
      {paymentMethod === "online" && (
        <div className="form-group">
          <label>Choose Online Payment Method:</label>
          <select
            name="onlinePaymentMethod"
            value={onlinePaymentMethod}
            onChange={handleOnlinePaymentChange}
            className="form-input"
          >
            <option value="upi">UPI Payment</option>
            <option value="qr">QR Code Scanner</option>
            <option value="bank">Bank Transfer</option>
          </select>
        </div>
      )}

      {/* UPI Payment */}
      {paymentMethod === "online" && onlinePaymentMethod === "upi" && (
        <div className="form-group">
          <label htmlFor="upiId">Enter UPI ID:</label>
          <input
            type="text"
            id="upiId"
            name="upiId"
            className="form-input"
            value={formData.upiId}
            onChange={handleChange}
            required
            placeholder="yourname@upi"
          />
        </div>
      )}

      {/* QR Code Scanner */}
      {paymentMethod === "online" && onlinePaymentMethod === "qr" && (
        <div className="form-group">
          <label>Scan the QR Code:</label>
          <img
            src="https://via.placeholder.com/150"
            alt="QR Code"
            className="qr-image"
          />
          <button type="button" className="scan-btn" onClick={handleScanQR}>
            Scan QR Code
          </button>
        </div>
      )}

      {/* Bank Transfer */}
      {paymentMethod === "online" && onlinePaymentMethod === "bank" && (
        <>
          <div className="form-group">
            <label htmlFor="bankAccount">Bank Account Number:</label>
            <input
              type="text"
              id="bankAccount"
              name="bankAccount"
              className="form-input"
              value={formData.bankAccount}
              onChange={handleChange}
              required
              placeholder="Enter bank account number"
            />
          </div>
          <div className="form-group">
            <label htmlFor="ifscCode">IFSC Code:</label>
            <input
              type="text"
              id="ifscCode"
              name="ifscCode"
              className="form-input"
              value={formData.ifscCode}
              onChange={handleChange}
              required
              placeholder="Enter IFSC code"
            />
          </div>
        </>
      )}

      <button type="submit" className="submit-btn" onClick={Order}>
        Order
      </button>
    </form>
  );
};
