import React, { useState } from "react";
import "../pages-css/Useraddress.css";
import { useNavigate } from "react-router-dom";
import { useCart } from "../Context/order";
import { useAlert } from "../Context/AlertContext";
import Cookies from "js-cookie";


// Delivery charges array to validate pincodes
export const deliveryChargesArray = [
  { pincode: "380001", charge: 25 },
  { pincode: "380002", charge: 30 },
  { pincode: "380003", charge: 30 },
  { pincode: "380004", charge: 30 },
  { pincode: "380005", charge: 50 },
  { pincode: "380006", charge: 40 },
  { pincode: "380007", charge: 50 },
  { pincode: "380008", charge: 40 },
  { pincode: "380009", charge: 30 },
  { pincode: "380013", charge: 40 },
  { pincode: "380014", charge: 50 },
  { pincode: "380015", charge: 50 },
  { pincode: "380016", charge: 45 },
  { pincode: "380018", charge: 35 },
  { pincode: "380019", charge: 70 },
  { pincode: "380021", charge: 40 },
  { pincode: "380022", charge: 40 },
  { pincode: "380023", charge: 40 },
  { pincode: "380024", charge: 45 },
  { pincode: "380026", charge: 50 },
  { pincode: "380027", charge: 30 },
  { pincode: "380028", charge: 50 },
  { pincode: "380050", charge: 90 },
  { pincode: "380051", charge: 80 },
  { pincode: "380052", charge: 50 },
  { pincode: "380054", charge: 100 },
  { pincode: "380055", charge: 90 },
  { pincode: "380058", charge: 140 },
  { pincode: "380059", charge: 95 },
  { pincode: "380060", charge: 125 },
  { pincode: "380061", charge: 50 },
  { pincode: "380063", charge: 45 },
  { pincode: "382110", charge: 210 },
  { pincode: "382115", charge: 225 },
  { pincode: "382120", charge: 290 },
  { pincode: "382130", charge: 350 },
  { pincode: "382140", charge: 320 },
  { pincode: "382145", charge: 310 },
  { pincode: "382150", charge: 345 },
  { pincode: "382170", charge: 280 },
  { pincode: "382210", charge: 120 },
  { pincode: "382213", charge: 125 },
  { pincode: "382220", charge: 130 },
  { pincode: "382225", charge: 175 },
  { pincode: "382230", charge: 220 },
  { pincode: "382240", charge: 180 },
  { pincode: "382245", charge: 300 },
  { pincode: "382250", charge: 280 },
  { pincode: "382255", charge: 280 },
  { pincode: "382260", charge: 200 },
  { pincode: "382265", charge: 280 },
  { pincode: "382315", charge: 275 },
  { pincode: "382330", charge: 100 },
  { pincode: "382340", charge: 75 },
  { pincode: "382345", charge: 70 },
  { pincode: "382350", charge: 100 },
  { pincode: "382405", charge: 120},
  { pincode: "382415", charge: 80 },
  { pincode: "382418", charge: 100 },
  { pincode: "382421", charge: 110 },
  { pincode: "382424", charge: 100 },
  { pincode: "382425", charge: 140 },
  { pincode: "382427", charge: 115 },
  { pincode: "382430", charge: 95 },
  { pincode: "382433", charge: 125 },
  { pincode: "382435", charge: 110 },
  { pincode: "382440", charge: 90 },
  { pincode: "382443", charge: 80 },
  { pincode: "382445", charge: 110 },
  { pincode: "382449", charge: 110 },
];

export const Useraddress = () => {
  const Navigate = useNavigate();
  const { cartData } = useCart();
  const [order, setOrder] = useState({});
  const [errors, setErrors] = useState({});
  const { showAlert } = useAlert();
   const token = Cookies.get("token");

  const [formData, setFormData] = useState({
    address: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
  });

  const validateForm = () => {
    const newErrors = {};
    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    } else if (formData.address.trim().length < 10) {
      newErrors.address = "Address should be at least 10 characters long";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    } else if (!/^[a-zA-Z\s]{3,}$/.test(formData.city)) {
      newErrors.city = "City should contain only letters and be at least 3 characters long";
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    } else if (!/^[a-zA-Z\s]{3,}$/.test(formData.state)) {
      newErrors.state = "State should contain only letters and be at least 3 characters long";
    }

    if (!formData.country.trim()) {
      newErrors.country = "Country is required";
    } else if (!/^[a-zA-Z\s]{4,}$/.test(formData.country)) {
      newErrors.country = "Country should contain only letters and be at least 4 characters long";
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = "Pincode must be exactly 6 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isPincodeServiceable = (pincode) => {
    return deliveryChargesArray.some(item => item.pincode === pincode);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Validate pincode serviceability
    if (!isPincodeServiceable(formData.pincode)) {
      showAlert("We currently do not deliver to this pincode.", "error");
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/Order`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...formData,
          cartid: cartData.cartid,
        }),
        credentials: "include"
      });


      const json = await response.json();

      if (json.order) {
        setOrder(json.order);
        Navigate("/payment", {
          state: {
            total: cartData.totalamount,
            address: json.order,
            cartDatas: cartData
          }
        });
      } else {
        showAlert(json.message || "Failed to save address", "error");
        Navigate("/cart");
      }
    } catch (error) {
      console.error("Error occurred during submission:", error);
      showAlert("An error occurred. Please try again later.", "error");
    }
  };

  return (
    <div className="ua-container">
      <form onSubmit={handleSubmit} className="ua-form">
        <h2 className="ua-title">Delivery Address</h2>

        <div className="ua-form-group">
          <label htmlFor="address" className="ua-label">Address:</label>
          <textarea
            id="address"
            name="address"
            className={`ua-textarea ${errors.address ? 'ua-input-error' : ''}`}
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter your complete address"
          />
          {errors.address && <span className="ua-error-text">{errors.address}</span>}
        </div>

        <div className="ua-form-group">
          <label htmlFor="city" className="ua-label">City:</label>
          <input
            type="text"
            id="city"
            name="city"
            className={`ua-input ${errors.city ? 'ua-input-error' : ''}`}
            value={formData.city}
            onChange={handleChange}
            placeholder="Enter city name"
          />
          {errors.city && <span className="ua-error-text">{errors.city}</span>}
        </div>

        <div className="ua-form-group">
          <label htmlFor="state" className="ua-label">State:</label>
          <input
            type="text"
            id="state"
            name="state"
            className={`ua-input ${errors.state ? 'ua-input-error' : ''}`}
            value={formData.state}
            onChange={handleChange}
            placeholder="Enter state name"
          />
          {errors.state && <span className="ua-error-text">{errors.state}</span>}
        </div>

        <div className="ua-form-group">
          <label htmlFor="country" className="ua-label">Country:</label>
          <input
            type="text"
            id="country"
            name="country"
            className={`ua-input ${errors.country ? 'ua-input-error' : ''}`}
            value={formData.country}
            onChange={handleChange}
            placeholder="Enter country name"
          />
          {errors.country && <span className="ua-error-text">{errors.country}</span>}
        </div>

        <div className="ua-form-group">
          <label htmlFor="pincode" className="ua-label">Pincode:</label>
          <input
            type="text"
            id="pincode"
            name="pincode"
            className={`ua-input ${errors.pincode ? 'ua-input-error' : ''}`}
            value={formData.pincode}
            onChange={handleChange}
            placeholder="Enter 6-digit pincode"
            maxLength="6"
          />
          {errors.pincode && <span className="ua-error-text">{errors.pincode}</span>}
        </div>

        <button type="submit" className="ua-submit-button">
         
          Continue to Payment
        </button>
         <br></br>
      </form>
    </div>
  );
};
