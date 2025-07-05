import { createContext, useState, useContext } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartData, setCartData] = useState({ cartid: null, totalamount: 0, bookdetail: [] });

    return (
        <CartContext.Provider value={{ cartData, setCartData }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
