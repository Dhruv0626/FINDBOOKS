import React, { useState } from "react";
import "../pages-css/ResellerPaymentForm.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useAlert } from "../Context/AlertContext";
import { deliveryChargesArray } from "./Useraddress";
import Cookies from "js-cookie";


export const ResellerPaymentForm = () => {
  const token = Cookies.get("token");
  const [paymentMethod, setPaymentMethod] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { bookData, UserRole } = location.state || {};
  const { showAlert } = useAlert();

  const [formData, setFormData] = useState({
    address: "",
    upi_id: "",
    bank_acc_no: "",
    ifsc_code: "",
    Pincode: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    let newErrors = {};
    if (formData.address.trim().length < 10) {
      newErrors.address = "Address must be at least 10 characters.";
    }
    if (!/^[0-9]{6}$/.test(formData.Pincode)) {
      newErrors.Pincode = "Pincode must be exactly 6 digits.";
    }
    if (!paymentMethod) {
      showAlert("Please select a payment method.", "error");
      return false;
    }
    if (paymentMethod === "UPI" && !/^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/.test(formData.upi_id)) {
      newErrors.upi_id = "Invalid UPI ID format.";
    }
    if (paymentMethod === "Banking Details") {
      if (!/^[0-9]{9,18}$/.test(formData.bank_acc_no)) {
        newErrors.bank_acc_no = "Bank account number must be 9 to 18 digits.";
      }
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifsc_code)) {
        newErrors.ifsc_code = "Invalid IFSC code format.";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate pincode delivery area
    const isPincodeValid = deliveryChargesArray.some(
      (item) => item.pincode === formData.Pincode
    );

    if (!isPincodeValid) {
      showAlert("Book will not collect on this location. Please enter a valid Pincode.", "error");
      return;
    }

    if (!validateForm()) return;

    // Prepare FormData for book submission (including image)
    const formDataToSend = new FormData();
    for (const key in bookData) {
      // Handle image file specifically (as file)
      if (key === "image" && bookData.image instanceof File) {
        formDataToSend.append("image", bookData.image);
      } else {
        formDataToSend.append(key, bookData[key]);
      }
    }

    try {
      // POST book data to API
      const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/${UserRole}/Book`, {
        method: "POST",
        body: formDataToSend,
        credentials: "include",
        headers: {
          authorization: `Bearer ${token}`,
          // Remove Content-Type header to let browser set it to multipart/form-data with boundary
          // "Content-Type": "application/json",
        },
      });

      const json = await response.json();

      if (json.book?._id) {
        const bookid = json.book._id;

        // Now POST payment form data with bookid
        const paymentResponse = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/ResellerPaymentForm`, {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...formData, bookid }),
          credentials: "include",
        });

        const paymentJson = await paymentResponse.json();

        if (paymentJson.data) {
          showAlert("Data added successfully, please check terms & conditions", "success");
          navigate("/SellOrders");
        } else {
          showAlert("Failed to save payment details", "error");
        }
      } else {
        showAlert(json.message || "Book not added", "error");
      }
    } catch (error) {
      console.error("Error occurred during submission:", error);
      showAlert("An error occurred while adding the book.", "error");
    }
  };

  //  if (!bookData) {
  //    return <p>No book data found. Please fill the book form first.</p>;
  // }

  return (
    <div className="resellpayment-form-container fade-in">
      <form onSubmit={handleSubmit} className="resellpayment-form" noValidate>
        <br></br>
        <h1 className="form-header">Payment Details Form</h1>

        <label>
          Address<span className="required">*</span>
        </label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          className="uniform-input"
          placeholder="Enter your address"
        />
        {errors.address && <p className="error-message">{errors.address}</p>}

        <label>
          Pincode<span className="required">*</span>
        </label>
        <input
          type="text"
          name="Pincode"
          value={formData.Pincode}
          onChange={handleChange}
          className="uniform-input"
          placeholder="Enter 6-digit pincode"
          maxLength="6"
        />
        {errors.Pincode && <p className="error-message">{errors.Pincode}</p>}

        <label>
          Payment Receive Method<span className="required">*</span>
        </label>
        <select
          className="uniform-input"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          <option value="">Select Payment Method</option>
          <option value="UPI">UPI</option>
          <option value="Banking Details">Banking Details</option>
        </select>
        {errors.paymentMethod && <p className="error-message">{errors.paymentMethod}</p>}

        {paymentMethod === "UPI" && (
          <>
            <label>
              UPI ID<span className="required">*</span>
            </label>
            <input
              type="text"
              name="upi_id"
              value={formData.upi_id}
              onChange={handleChange}
              className="uniform-input"
              placeholder="Enter your UPI ID"
            />
            {errors.upi_id && <p className="error-message">{errors.upi_id}</p>}
          </>
        )}

        {paymentMethod === "Banking Details" && (
          <>
            <label>
              Bank Account Number<span className="required">*</span>
            </label>
            <input
              type="text"
              name="bank_acc_no"
              value={formData.bank_acc_no}
              onChange={handleChange}
              className="uniform-input"
              placeholder="Enter your bank account number"
            />
            {errors.bank_acc_no && <p className="error-message">{errors.bank_acc_no}</p>}

            <label>
              IFSC Code<span className="required">*</span>
            </label>
            <input
              type="text"
              name="ifsc_code"
              value={formData.ifsc_code}
              onChange={handleChange}
              className="uniform-input"
              placeholder="Enter IFSC code"
            />
            {errors.ifsc_code && <p className="error-message">{errors.ifsc_code}</p>}
          </>
        )}

        <button type="submit" className="resellpayment-button" onClick={handleSubmit}>
          Submit
        </button>
        <br></br>
      </form>
    </div>
  );
};
