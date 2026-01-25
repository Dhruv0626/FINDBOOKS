import React from "react";
import "../components-css/HomeFeature.css"; // External CSS file
import { FaTruck, FaCreditCard, FaTag, FaSyncAlt } from "react-icons/fa"; // Using FontAwesome icons

const features = [
  {
    icon: <FaTruck />,
    title: "Quick Delivery",
    description: "Deliver & collect Books from best courier service.",
  },
  {
    icon: <FaCreditCard />,
    title: "Pay with Easy",
    description: "Easy Pay option with secure Razorpay payment gateway.",
  },
  {
    icon: <FaTag />,
    title: "Best Deal",
    description: "Find best offer on books. Stay tuned.",
  },
  {
    icon: <FaSyncAlt />,
    title: "Resell Your Books",
    description:
      "Sell your old books easily & earn cash. Join our book reselling program today!",
  },
];

export const HomeFeatures = () => {
  return (
    <div className="features-container">
      {features.map((feature, index) => (
        <div key={index} className="feature-card">
          <div className="feature-icon">{feature.icon}</div>
          <h3 className="feature-title">{feature.title}</h3>
          <p className="feature-description">{feature.description}</p>
        </div>
      ))}
    </div>
  );
};
