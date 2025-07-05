import { createContext, useContext, useState } from "react";

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  const showAlert = (message, type) => {
    setAlert({ message, type, visible: true });

    // Auto-hide after 3 seconds
    setTimeout(() => {
      setAlert({ message: "", type: "", visible: false });
    }, 3000);
  };

  return (
    <AlertContext.Provider value={{ alert, showAlert, setAlert }}>
      {children}
    </AlertContext.Provider>
  );
};

// Custom hook to use alert anywhere
export const useAlert = () => useContext(AlertContext);
