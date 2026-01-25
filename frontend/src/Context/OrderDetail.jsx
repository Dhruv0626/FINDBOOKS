
import { createContext, useContext, useState } from "react";

const ViewOrderContext = createContext();

export const ViewOrderProvider = ({ children }) => {
    const [orderDetails, setOrderDetails] = useState(null);

    return (
        <ViewOrderContext.Provider value={{ orderDetails, setOrderDetails }}>
            {children}
        </ViewOrderContext.Provider>
    );
};

export const useViewOrder = () => useContext(ViewOrderContext);
