import React, { useEffect, useState } from "react";
import "../pages-css/Payment.css";
import { useLocation, useNavigate } from "react-router-dom";
import { CreditCard, Package, Truck, Shield, ArrowLeft } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { useAlert } from "../Context/AlertContext";
import { deliveryChargesArray } from "./Useraddress";
import Cookies from "js-cookie";

export const Payment = () => {
  const [OrderData, setOrderData] = useState();
  const [paymentMethod, setPaymentMethod] = useState("Online");
  // const [pcharge, setPcharge] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [loading, setLoading] = useState(false);
  const token = Cookies.get("token");
  const { showAlert } = useAlert();

  const location = useLocation();
  const Navigate = useNavigate();

  const { total, address, cartDatas } = location.state || {};

  const initPayment = async (data) => {
    const options = {
      key: data.key,
      amount: data.amount,
      currency: data.currency,
      name: "Find Books",
      description: "Test Transaction",
      image: "https://example.com/your_logo",
      order_id: data.id,
      handler: async (response) => {
        try {
          const verifyResponse = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/verify`, {
            method: "POST",
            headers: { authorization: `Bearer ${token}`,"Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_orderID: response.razorpay_order_id,
              razorpay_paymentID: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order: total + deliveryCharge,
              orderID: OrderData._id,
            }),
            credentials: "include",
          });

          const json = await verifyResponse.json();
          if (json.payment.payment_status === "Completed") {
            addorder();
          }
          showAlert("payment success", "success");
          Navigate("/MyOrder");
        } catch (error) {
          console.error("Error verifying payment:", error);
        }
      },
      prefill: {
        name: "Customer Name",
        email: "customer@example.com",
        contact: "9999999999",
      },
      notes: {
        address: "Razorpay Corporate Office",
      },
      theme: {
        color: "#3399cc",
      },
    };

    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  };

  const payment = async () => {
    try {
    const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/orders`, {
        method: "POST",
        headers: {authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total  + deliveryCharge }),
        credentials: "include",
      });

      const data = await response.json();
      if (data.data) {
        initPayment(data.data);
      } else {
        Navigate("/cart");
      }
    } catch (error) {
      console.error("Error creating order:", error.message);
    }
  };

  const addorder = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/addorder`, {
        method: "PUT",
        headers: { authorization: `Bearer ${token}`,"Content-Type": "application/json" },
        body: JSON.stringify({
          cartid: cartDatas.cartid,
          TotalAmount: total + deliveryCharge,
        }),
        credentials: "include",
      });

      console.log(cartDatas);

      if (!response.ok) throw new Error("Failed to update quantity");
      clearcart();
    } catch (error) {
      showAlert("An error occurred while updating the quantity", "error");
    }
  };

  const clearcart = async () => {
    try {
      await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/Cart`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}`,"Content-Type": "application/json" },
        credentials: "include",
      });
    } catch (error) {
      showAlert("An error occurred while removing the item", "error");
    }
  };

  useEffect(() => {
    const fetchCarts = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/CurrentOrder`, {
                  headers: { authorization: `Bearer ${token}`,"Content-Type": "application/json" },
                  credentials: "include",
        });
        const json = await response.json();
        setOrderData(json.order);
      } catch (error) {
        console.error("Error fetching order data:", error);
      }
    };

    fetchCarts();
  }, []);

  // useEffect(() => {
  //   if (!cartDatas?.bookdetail?.length) return;
  //   // Filter old books
  //   const oldBooks = cartDatas.bookdetail.filter(book => book?.Isoldbook);
  //   // Sum quantity of old books
  //   const totalOldBookQuantity = oldBooks.reduce((sum, book) => sum + (book.Quantity || 0), 0);
  //   // Calculate platform charge: quantity * 3 * 5
  //   const calculatedPcharge = totalOldBookQuantity *  5;
  //   setPcharge(calculatedPcharge);
  // }, [cartDatas]);

  useEffect(() => {
    if (!OrderData?.Address) return;
    const pincode = OrderData.Address.match(/\d{6}$/)?.[0];
    const chargeData = deliveryChargesArray.find(item => item.pincode === pincode);
    setDeliveryCharge(chargeData?.charge || 0);
  }, [OrderData]);

  const handlePayment = async () => {
    setLoading(true);
    try {
      await payment();
    } finally {
      setLoading(false);
    }
  };

  const handleCOD = async () => {
    setLoading(true);
    try {
      await clear();
    } finally {
      setLoading(false);
    }
  };

  const clear = async () => {
    try {
      await addorder();

      if (!OrderData?._id) {
        showAlert("Order data is missing. Please try again.", "error");
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/credit/codpayment`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`,"Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: OrderData._id,
          payment_method: paymentMethod,
          payment_status: "Pending",
          total_payment: total + deliveryCharge,
        }),
        credentials: "include",
      });

      const json = await response.json();
      if (json.payment) {
        showAlert("Data saved successfully!", "success");
        Navigate("/Orders", { state: { paymentdetail: json.payment } });
      } else {
        showAlert("Payment data was not returned. Please try again.", "error");
      }
    } catch (error) {
      showAlert("An error occurred. Please try again later.", "error");
    }
  };

  return (
    <>
      <div className="payment-container">
        <div className="payment-header">
          <button className="back-button" onClick={() => Navigate(-1)}>
            <ArrowLeft size={20} />
            Back to Cart
          </button><br/><br/>
          <h1>Checkout</h1>
          <div className="checkout-steps">
            <div className="step active">
              <Package size={24} />
              <span>Order Summary</span>
            </div>
            <div className="step active">
              <CreditCard size={24} />
              <span>Payment</span>
            </div>
            <div className="step">
              <Truck size={24} />
              <span>Delivery</span>
            </div>
          </div>
        </div>

        <div className="payment-content">
          <div className="order-summary-section">
            <h2>Order Summary</h2>
            <div className="paymentorder-details">
              <div className="price-breakdown">
                <div className="price-item">
                  <span>Subtotal</span>
                  <span>₹{total}</span>
                </div>
                {/* <div className="price-item">
                  <span>Platform Fee</span>
                  <span>₹{pcharge}</span>
                </div> */}
                <div className="price-item">
                  <span>Delivery Charges</span>
                  <span>
                    {deliveryCharge === 0 ? "Free" : `₹${deliveryCharge}`}
                  </span>
                </div>
                <div className="price-item total">
                  <span>Total Amount</span>
                  <span>₹{total + deliveryCharge}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="payment-section">
            <h2>Payment Method</h2>
            <div className="payment-methods">
              <div
                className={`payment-method-card ${paymentMethod === "Online" ? "selected" : ""
                  }`}
              >
                <input
                  type="radio"
                  id="online"
                  name="paymentMethod"
                  value="Online"
                  checked={paymentMethod === "Online"}
                  onChange={() => setPaymentMethod("Online")}
                />
                <label htmlFor="online">
                  <CreditCard size={24} />
                  <div>
                    <span>Online Payment</span>
                    <small>Pay securely with card, UPI, or net banking</small>
                  </div>
                </label>
              </div>

              <div
                className={`payment-method-card ${paymentMethod === "COD" ? "selected" : ""
                  }`}
              >
                <input
                  type="radio"
                  id="cod"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                />
                <label htmlFor="cod">
                  <Package size={24} />
                  <div>
                    <span>Cash on Delivery</span>
                    <small>Pay when you receive your order</small>
                  </div>
                </label>
              </div>
            </div>

            <div className="security-info">
              <Shield size={20} />
              <span>Your payment information is secure and encrypted</span>
            </div>

            <button
              className="payment-pay-button"
              onClick={paymentMethod === "COD" ? handleCOD : handlePayment}
              disabled={loading}
            >
              {loading
                ? "Processing..."
                : paymentMethod === "COD"
                  ? "Place Order"
                  : `Pay ₹${total +  deliveryCharge}`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
