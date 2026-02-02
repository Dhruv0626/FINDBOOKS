

import React, { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { CartProvider } from "./Context/order";
import { AuthProvider } from "./Context/AdminContext";
import { ViewOrderProvider } from "./Context/OrderDetail";
import { AlertProvider } from "./Context/AlertContext";
import { Alert } from "./components/Alert";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <AlertProvider>
      <Alert/>
      <AuthProvider>
        <CartProvider>
          <ViewOrderProvider>
            <App />
          </ViewOrderProvider>
        </CartProvider>
      </AuthProvider>
    </AlertProvider>
  </StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(() => {
        console.log("Service Worker registered");
      })
      .catch((err) => {
        console.error("Service Worker registration failed:", err);
      });
  });
}
