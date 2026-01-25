import React, { useState, useEffect } from "react";
import "../pages-css/Cart.css";
import { Navbar } from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { useCart } from "../Context/order";
import { FaTrashAlt, FaShoppingCart, FaArrowRight, FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAlert } from "../Context/AlertContext";
import Cookies from "js-cookie";
import {formatIndianNumberWithoutDecimal} from "../utils/formatIndianNumber"
import {formatIndianNumber} from "../utils/formatIndianNumber"



export const Cart = () => {
    const token = Cookies.get("token");
    const [carts, setCarts] = useState([]);
    const [bookdetail, setBookdetail] = useState([]);
    const [quantities, setQuantities] = useState({});
    const [loading, setLoading] = useState(true);
    const Navigate = useNavigate();
    const { setCartData } = useCart();
      const {showAlert} = useAlert();

    const handleRemoveItem = async (bookid) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/Cart`, {
                method: 'PUT',
                headers: {
                    authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },                body: JSON.stringify({ book_id: bookid }),
                credentials: 'include',
            });

            const json = await response.json();
            if (json.cart.cart_quantity === 0) { 
                clearcart();
            }

            if (response.ok) {
                setCarts(json.cart);
                setBookdetail(json.books);
            } else {
                showAlert('Failed to remove item',"error");
            }
        } catch (error) {
            console.error('Error removing item:', error);
            showAlert('An error occurred while removing the item',"error");
        }
    };

    const getTotalPrice = () => {
        return bookdetail.reduce((total, item) => {
            return total + item.Price * (quantities[item._id] || 1); 
        }, 0);
    };

    useEffect(() => {
        const fetchCarts = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/Cart`, {
                    credentials: "include",
                    headers: {
                        authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                });
                const json = await response.json();
                setCarts(json.cart);
                setBookdetail(json.books);

                // Store updated quantities in state
                const quantityMap = {};
                json.cart.forEach((cartItem) => {
                    cartItem.books.forEach((book) => {
                        quantityMap[book.book_id] = book.book_quantity;
                    });
                });
                setQuantities(quantityMap); // Update state with latest values
            } catch (error) {
                console.error("Error fetching book data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCarts();
    }, []);

    const handleQuantityChange = async (bookid, action) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/updatequantity`, {
                method: 'PUT',
                headers: {
                    authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },                body: JSON.stringify({ book_id: bookid, action }),
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error("Failed to update quantity");
            }

            const json = await response.json();
            setCarts(json.cart);
            setBookdetail(json.books);

            // Update quantity state from backend response
            const updatedQuantities = {};
            json.cart.books.forEach(book => {
                updatedQuantities[book.book_id] = book.book_quantity;
            });
            setQuantities(updatedQuantities);
        } catch (error) {
            console.error("Error updating quantity:", error);
            showAlert("No more quantity available for this book ","error");
        }
    };

    const clearcart = async() => {
        try {
            const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/Cart`, {
                method: 'DELETE',
                headers: {
                    authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },                credentials: 'include',
            });

            const json = await response.json();

            if (response.ok) {
                setCarts(json.cart);
                setBookdetail(json.books);
            } else {
                alert('Failed to clear cart');
            }
        } catch (error) {
            console.error('Error clearing cart:', error);
            showAlert('An error occurred while clearing the cart',"error");
        }
    }

    const checkout = async () => {
        try {
            const cartid = carts.length > 0 ? carts[0]._id : null;
            const totalamount = getTotalPrice();

            // Save cartid and totalamount in context
            setCartData({ cartid, totalamount, bookdetail });

            // Navigate to the UserAddress page
            Navigate("/Useraddress");
        } catch (error) {
            showAlert("An error occurred. Please try again later.","error");
            console.error("Error occurred during submission:", error);
        }
    };

    if (loading) {
        return (
            <>
                <Navbar flag={true}/>
                <div className="cart-container">
                    <h1 className="cart-title">Shopping Cart</h1>
                    <p className="empty-cart">Loading your cart...</p>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="cart-container">
                <h1 className="cart-title">Shopping Cart</h1>
                {carts.length === 0 ? (
                    <div>
                        <p className="empty-cart">Your cart is empty!</p>
                        <div className="empty-cart-actions">
                            <Link to="/">Continue Shopping</Link>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="cart-items">
                            {bookdetail.map((item) => {
                                const quantity = quantities[item._id] || 1;
                                return (
                                    <div key={item._id} className="cart-item">
                                        {item && (
                                            <>
                                                <span className={`item-type ${item.Isoldbook ? "item-type-resell" : "item-type-new"}`}>
                                                    {item.Isoldbook ? "Resell" : "New"}
                                                </span>
                                                <img
                                                    src={`${item.BookImageURL}`}
                                                    alt={item.BookName}
                                                    className="item-image"
                                                />
                                                <div className="item-details">
                                                    <h3 className="item-name">{item.BookName}</h3>
                                                    <p className="item-price">
                                                        Price : <b>₹{formatIndianNumberWithoutDecimal(item.Price)}</b>
                                                    </p>
                                                    {item.Author && (
                                                        <p className="item-author"><b>Author : </b> {item.Author}</p>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                        <div className="item-actions">
                                            <span className="quantity-label">Quantity :</span>
                                            <div className="quantity">
                                                <button
                                                    onClick={() => handleQuantityChange(item._id, "D")}
                                                    disabled={item.Isoldbook}
                                                    title={item.Isoldbook ? "Resell items have fixed quantity" : "Decrease quantity"}
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="text"
                                                    min="1"
                                                    value={item.Isoldbook ? item.Quantity : (quantities[item._id] || 1)}
                                                    readOnly
                                                />
                                                <button
                                                    onClick={() => handleQuantityChange(item._id, "I")}
                                                    disabled={item.Isoldbook}
                                                    title={item.Isoldbook ? "Resell items have fixed quantity" : "Increase quantity"}
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <button
                                                className="remove-button"
                                                onClick={() => handleRemoveItem(item._id)}
                                                
                                                title="Remove from cart"
                                            >
                                                <FaTrashAlt /> Remove
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="cart-summary">
                            <div className="summary-header">
                                <h2 className="summary-title">Order Summary</h2>
                                <p className="summary-total">₹{formatIndianNumber(getTotalPrice())}</p>
                            </div>
                            <div className="summary-actions">
                                <button className="clear-cart-button" onClick={clearcart} title="Clear all items">
                                    <FaTimes /> Clear
                                </button>
                                <button
                                    className="checkout-button"
                                    onClick={checkout}
                                    title="Proceed to checkout"
                                >
                                    Checkout <FaArrowRight />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
};