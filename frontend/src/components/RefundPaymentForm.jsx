import React, { useState } from "react";
import { useAlert } from "../Context/AlertContext";
import "./../components-css/RefundPaymentForm.css";

const RefundPaymentForm = ({ orderId, paymentId, onSubmit }) => {
  const { showAlert } = useAlert();
  const [paymentOption, setPaymentOption] = useState("");
  const [upiId, setUpiId] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validateInputs = () => {
    if (!paymentOption) {
      showAlert("Please select a payment option.", "error");
      return false;
    }
    if (paymentOption === "UPI ID") {
      if (!upiId) {
        showAlert("Please enter your UPI ID.", "error");
        return false;
      }
      const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/;
      if (!upiRegex.test(upiId)) {
        showAlert("Invalid UPI ID format.", "error");
        return false;
      }
    }
    if (paymentOption === "Bank Account Details") {
      if (!bankAccountNumber) {
        showAlert("Please enter your bank account number.", "error");
        return false;
      }
      const bankAccRegex = /^[0-9]{9,18}$/;
      if (!bankAccRegex.test(bankAccountNumber)) {
        showAlert("Bank account number must be 9 to 18 digits.", "error");
        return false;
      }
      if (!ifscCode) {
        showAlert("Please enter your IFSC code.", "error");
        return false;
      }
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(ifscCode)) {
        showAlert("Invalid IFSC code format.", "error");
        return false;
      }
    }
    if (!reason) {
      showAlert("Please provide a reason for the refund.", "error");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateInputs()) {
      return;
    }

    setSubmitting(true);
    try {
      const refundData = {
        payment_id: paymentId,
        refund_status: "Pending",
        refund_method: paymentOption,
        reason,
        bank_acc_no: paymentOption === "Bank Account Details" ? bankAccountNumber : "",
        ifsc_code: paymentOption === "Bank Account Details" ? ifscCode : "",
        upi_id: paymentOption === "UPI ID" ? upiId : "",
      };
      await onSubmit(refundData);
    } catch (err) {
      showAlert("Failed to submit refund payment. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="refund-payment-form-container fade-in">
      <form className="refund-payment-form" onSubmit={handleSubmit}>
        <div className="form-header">
          <h2>Refund Payment Information</h2>
        </div>

        <label htmlFor="paymentOption" className="label-text">
          Payment Option<span className="required">*</span>
        </label>
        <select
          id="paymentOption"
          value={paymentOption}
          className="select-input"
          onChange={(e) => setPaymentOption(e.target.value)}
        >
          <option value="">Select an option</option>
          <option value="UPI ID">UPI ID</option>
          <option value="Bank Account Details">Bank Account Details</option>
        </select>

        {paymentOption === "UPI ID" && (
          <>
            <label htmlFor="upiId" className="label-text">
              UPI ID<span className="required">*</span>
            </label>
            <input
              type="text"
              id="upiId"
              value={upiId}
              className="text-input"
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="Enter your UPI ID"
            />
          </>
        )}

        {paymentOption === "Bank Account Details" && (
          <>
            <label htmlFor="bankAccountNumber" className="label-text">
              Bank Account Number<span className="required">*</span>
            </label>
            <input
              type="text"
              id="bankAccountNumber"
              value={bankAccountNumber}
              className="text-input"
              onChange={(e) => setBankAccountNumber(e.target.value)}
              placeholder="Enter your bank account number"
            />

            <label htmlFor="ifscCode" className="label-text">
              IFSC Code<span className="required">*</span>
            </label>
            <input
              type="text"
              id="ifscCode"
              value={ifscCode}
              className="text-input"
              onChange={(e) => setIfscCode(e.target.value)}
              placeholder="Enter your IFSC code"
            />
          </>
        )}

        <label htmlFor="reason" className="label-text">
          Reason for Refund<span className="required">*</span>
        </label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Provide the reason for refund"
          rows={3}
          className="textarea-input"
        />

        <div className="form-buttons">
          <button
            type="submit"
            className="submit-button"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Refund"}
          </button>
        </div>
        <br></br>
      </form>
    </div>
  );
};

export default RefundPaymentForm; 
