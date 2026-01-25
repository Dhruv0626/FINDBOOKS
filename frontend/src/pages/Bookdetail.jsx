import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../pages-css/Bookdetail.css";
import { Navbar } from "../components/Navbar";
import { FaStar, FaShoppingCart, FaCheckCircle, FaBookOpen, FaCalendarAlt, FaUser, FaBuilding, FaGraduationCap, FaUniversity, FaBarcode, FaTag, FaInfoCircle, FaBookmark } from "react-icons/fa";
import Cookies from "js-cookie";
import { ShieldCheck, Star, CreditCard, Truck, Leaf } from "lucide-react";
import { useAlert } from "../Context/AlertContext";
import { ImBooks } from "react-icons/im";


export const Bookdetail = () => {
  const token = Cookies.get("token");
  const location = useLocation();
  const Navigate = useNavigate();
  const { bookid, book } = location.state || {};
  const { showAlert } = useAlert();

  const [rating, setRating] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [isNewRelease, setIsNewRelease] = useState(false);

  const features = [
    { icon: <ShieldCheck className="feature-icon" />, text: "Piracy-free" },
    { icon: <Star className="feature-icon" />, text: "Assured Quality" },
    { icon: <CreditCard className="feature-icon" />, text: "Secure Transactions" },
    { icon: <Truck className="feature-icon" />, text: "Fast Delivery" },
    { icon: <Leaf className="feature-icon" />, text: "Sustainably Printed" },
  ];

  useEffect(() => {
    if (book?.Publication_Date) {
      const publicationDate = new Date(book.Publication_Date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      setIsNewRelease(publicationDate > thirtyDaysAgo);
    }

    fetchAverageRating();
    window.scrollTo(0, 0);
  }, [book]);

  const formatPrice = (price) => {
    if (typeof price === "number") {
      return `₹${price.toLocaleString()}`;
    } else if (typeof price === "string" && !price.includes("₹")) {
      return `₹${price}`;
    }
    return price;
  };

  const fetchAverageRating = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/Ratings/average/${book._id}`, {
        headers: {
          authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      setAvgRating(parseFloat(data.averageRating) || 0);
    } catch (error) {
      console.error("Error fetching average rating:", error);
    }
  };

  const addRatings = async (currentRating) => {
    if (!token) {
      Navigate("/login");
      showAlert("Please Login/Register First", "error");
      return;
    }

    setRating(currentRating);
    try {
      const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/Ratings`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }, body: JSON.stringify({ book_id: book._id, rate: currentRating }),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.error) {
          showAlert(data.error, "error");
          return;
        }
        throw new Error("Failed to add rating");
      }

      fetchAverageRating();
    } catch (error) {
      console.error("Error adding ratings:", error);
    }
  };

  const addtocart = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!token) {
      Navigate("/login");
    } else {
      try {
        const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/Cart`, {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }, body: JSON.stringify({ book_id: book._id, cart_quantity: 1 }),
          credentials: "include",
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to add to cart");

        Navigate("/cart");
      } catch (error) {
        console.error("Error adding to cart:", error.message);
      }
    }
  };

  const buynow = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!token) {
      Navigate("/login");
    } else {
      try {
        const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/Cart`, {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }, body: JSON.stringify({ book_id: book._id, cart_quantity: 1 }),
          credentials: "include",
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to add to cart");

        Navigate("/cart");
      } catch (error) {
        console.error("Error adding to cart:", error.message);
      }
    }
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return "";
    const dateObj = new Date(isoDate);
    return `${dateObj.getDate().toString().padStart(2, "0")}-${(dateObj.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${dateObj.getFullYear()}`;
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) {
        stars.push(<FaStar key={i} size={20} color="#ffc107" />);
      } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
        stars.push(
          <span key={i} className="half-star" style={{ position: "relative", display: "inline-block" }}>
            <FaStar size={20} color="#e4e5e9" />
            <FaStar size={20} color="#ffc107" style={{ position: "absolute", left: 0, clipPath: "inset(0 50% 0 0)" }} />
          </span>
        );
      } else {
        stars.push(<FaStar key={i} size={20} color="#e4e5e9" />);
      }
    }
    return stars;
  };

  if (!book) {
    return (
      <>
        <Navbar />
        <div className="bookdetails-maincontainer">
          <div className="bookdetails-container">
            <p>Book details not found. Please go back to the home page.</p>
          </div>
        </div>
      </>
    );
  }

  const isOutOfStock = book.Quantity === 0;

  return (
    <>
      <Navbar />
      <div className="bookdetails-maincontainer">
        <div className="bookdetails-container">
          <div className="book-first">
            <div className="book-img">
              <img src={`${book.BookImageURL}`} alt={book.BookName} />
            </div>
            <div className="averagerating-container">
              <span className="stars-container">{renderStars(avgRating)}</span>
              <span>&nbsp; ({avgRating.toFixed(1)})</span>
            </div>
            <div className="features-container">
              <div className="features-grid">
                {features.map((feature, index) => (
                  <div key={index} className="feature-item">
                    {feature.icon}
                    <p className="feature-text">{feature.text}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 🔴 Low stock alert message */}
            {!book.Isoldbook && book.Quantity <= 10 && book.Quantity > 0 && (
              <p style={{ color: "red", fontWeight: "bold", margin: "auto", fontSize: "1.2rem" }}>
                Hurry! Only {book.Quantity} books available
              </p>
            )}
            {isOutOfStock && (
              <p style={{ color: "darkred", fontWeight: "bold", margin: "auto", fontSize: "1.2rem"  }}>
                Out of Stock
              </p>
            )}
          </div>
          <div className="book-data">
            <div className="book-badges">
              {isNewRelease && (
                <span className="badge badge-new">
                  <FaCheckCircle /> New Release
                </span>
              )}
              {book.Isoldbook ? (
                <span className="badge badge-bestseller">
                  <FaBookmark /> Pre-owned
                </span>
              ) : (
                <span className="badge badge-bestseller">
                  <FaTag /> New
                </span>
              )}
            </div>


            <h2 className="book-name">{book.BookName}</h2>
            <div className="book-info-grid">
              <p><b><FaUser /> Author :&nbsp;</b> {book.Author}</p>
              <p><b><FaBookOpen /> Edition :&nbsp;</b> {book.Edition || "Standard"}</p>
              <p><b><FaCalendarAlt /> Published :&nbsp;</b> {formatDate(book.Publication_Date)}</p>
              <p><b><FaBuilding /> Publisher :&nbsp;</b> {book.Publisher}</p>
            <p><b><FaBarcode /> ISBN Number :&nbsp;</b> {book.ISBN}</p>
            {book.Class && <p><b><FaGraduationCap /> Class :&nbsp;</b> {book.Class}</p>}
            {book.Board && <p><b><FaUniversity /> Board :&nbsp;</b> {book.Board}</p>}
            {book.Isoldbook && (
              <p><b><ImBooks /> Quantity :&nbsp;</b> {book.Quantity}</p>
            )}
          </div>

            <div className="book-description">
              <h3><FaInfoCircle /> About this Book</h3>
              <p>{book.Description || "No description available for this Book"}</p>
            </div>

            <div className="rating-container">
              <b>Rate this book:</b>
              {[...Array(5)].map((_, index) => {
                const currentRating = index + 1;
                return (
                  <FaStar
                    key={index}
                    className="star"
                    size={20}
                    color={currentRating <= rating ? "#ffc107" : "#e4e5e9"}
                    onClick={() => addRatings(currentRating)}
                  />
                );
              })}
            </div>

            <div className="price-btn">
              <div className="price">
                <p><b>Price&nbsp;: </b>&nbsp;<span className="price-tag"><b>{formatPrice(book.Price)}</b></span></p>
              </div>
              <button className="buynow-btn" onClick={buynow} disabled={isOutOfStock}>
                <FaCheckCircle /> Buy Now
              </button>
              <button className="addtocart-btn" onClick={addtocart} disabled={isOutOfStock}>
                <FaShoppingCart /> Add To Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
