import React, { useState, useEffect } from "react";
import "../components-css/Filter.css";
import { FiFilter, FiX } from "react-icons/fi";

export const FilterComponent = ({ books, onFilterChange, subcategory, classOptions = [], boardOptions = [] }) => {
  const [condition, setCondition] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedBoard, setSelectedBoard] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    filterBooks();
  }, [condition, priceRange, author, publisher, selectedClass, selectedBoard, subcategory]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
      if (window.innerWidth > 1024) {
        setIsSidebarOpen(true); // Always show sidebar on large screens
      } else {
        setIsSidebarOpen(false); // Hide sidebar on small screens
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filterBooks = () => {
    let filtered = [...books];

    if (condition) {
      filtered = filtered.filter(book => book.Condition?.trim().toLowerCase() === condition.toLowerCase());
    }

    if (priceRange === "low") {
      filtered = filtered.filter(book => book.Price >= 100 && book.Price <= 500);
    } else if (priceRange === "medium") {
      filtered = filtered.filter(book => book.Price > 500 && book.Price <= 1000);
    } else if (priceRange === "high") {
      filtered = filtered.filter(book => book.Price > 1000);
    }

    if (author) {
      filtered = filtered.filter(book => book.Author?.trim().toLowerCase() === author.toLowerCase());
    }

    if (publisher) {
      filtered = filtered.filter(book => book.Publisher?.trim().toLowerCase() === publisher.toLowerCase());
    }

    if (subcategory?.toLowerCase() === "school books") {
      if (selectedClass) {
        filtered = filtered.filter(book => book.Class?.trim().toLowerCase() === selectedClass.toLowerCase());
      }
      if (selectedBoard) {
        filtered = filtered.filter(book => book.Board?.trim().toLowerCase() === selectedBoard.toLowerCase());
      }
    }

    onFilterChange(filtered);
  };

  const uniqueAuthors = [...new Set(books.map(book => book.Author?.trim()))];
  const uniquePublishers = [...new Set(books.map(book => book.Publisher?.trim()))];

  return (
    <>
      {/* Mobile Sidebar Toggle Button (Only visible on small screens) */}
      {isMobile && (
        <button className="filter-toggle" onClick={() => setIsSidebarOpen(true)}>
          <FiFilter size={24} />
        </button>
      )}

      {/* Sidebar */}
      <div className={`filter-sidebar ${isSidebarOpen || !isMobile ? "open" : ""}`}>
        {/* Close Button (Visible only on small screens) */}
        {isMobile && (
          <button className="close-btn" onClick={() => setIsSidebarOpen(false)}>
            <FiX size={24} />
          </button>
        )}

        <h2 className="filter-sidebar-h2">Filters</h2>

        <label className="filter-sidebar-label">Condition (For Resell Books)</label>
        <select value={condition} onChange={(e) => setCondition(e.target.value)} className="filter-select">
          <option value="">All</option>
          <option value="Fair">Fair</option>
          <option value="Good">Good</option>
          <option value="Excellent">Excellent</option>
        </select>

        <label>Price Range</label>
        <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="filter-select">
          <option value="">All</option>
          <option value="low">Rs.100 - Rs.500</option>
          <option value="medium">Rs.501 - Rs.1000</option>
          <option value="high">Rs.1000 +</option>
        </select>

        <label>Author</label>
        <select value={author} onChange={(e) => setAuthor(e.target.value)} className="filter-select">
          <option value="">All</option>
          {uniqueAuthors.map((auth, index) => (
            <option key={index} value={auth}>{auth}</option>
          ))}
        </select>

        <label>Publisher</label>
        <select value={publisher} onChange={(e) => setPublisher(e.target.value)} className="filter-select">
          <option value="">All</option>
          {uniquePublishers.map((pub, index) => (
            <option key={index} value={pub}>{pub}</option>
          ))}
        </select>

        {(subcategory && subcategory.toLowerCase() === "school books") && (
          <>
            <label>Class</label>
            {classOptions.length > 0 ? (
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="filter-select">
                <option value="">All</option>
                {classOptions.map((cls, index) => (
                  <option key={index} value={cls}>{cls}</option>
                ))}
              </select>
            ) : (
              <p>No class options available</p>
            )}

            <label>Board</label>
            {boardOptions.length > 0 ? (
              <select value={selectedBoard} onChange={(e) => setSelectedBoard(e.target.value)} className="filter-select">
                <option value="">All</option>
                {boardOptions.map((board, index) => (
                  <option key={index} value={board}>{board}</option>
                ))}
              </select>
            ) : (
              <p>No board options available</p>
            )}
          </>
        )}
      </div>
    </>
  );
};
