

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
