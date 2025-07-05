import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../components-css/Bookcard.css";
import Load from "../components/Load";
import { Bookcard } from "../components/Bookcard";
import { FilterComponent } from "../components/Filter";
import Cookies from "js-cookie";



export const BooksPage = () => {
  const token = Cookies.get("token");
  const { category, subcategory } = useParams();
  const [book, setBook] = useState([]);
  const [originalBooks, setOriginalBooks] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const [bookRes, sellOrderRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_RENDER_BACK}/api/${subcategory}/Books`, {
            headers: {
              authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
          fetch(`${import.meta.env.VITE_RENDER_BACK}/api/resellerbook`, {
            headers: {
              authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          })
        ]);

        const [bookData, sellOrderData] = await Promise.all([
          bookRes.json(),
          sellOrderRes.json()
        ]);

        if (!Array.isArray(bookData) || !sellOrderData?.resellers) {
          console.warn("Expected an array but got:", bookData, sellOrderData);
          setBook([]);
          setOriginalBooks([]);
          setLoading(false);
          return;
        }

        setBook(bookData);
        setOriginalBooks(bookData);

        // Hide books only if Resell_Status is "Sell", "Collected"
        const hiddenBookIds = new Set(
          sellOrderData.resellers
            .filter(reseller => ["Sell", "Collected"].includes(reseller.Resell_Status))
            .map(reseller => reseller.Book_id)
        );

        setBook(bookData.filter(book => !hiddenBookIds.has(book._id)));

        setLoading(false);
      } catch (error) {
        console.error("Error fetching books:", error);
        setLoading(false);
      }
    };
    fetchBooks();
  }, [subcategory]);

  // Normalize subcategory for comparison
  const normalizedSubcategory = subcategory?.trim().toLowerCase();

  // Extract unique classOptions and boardOptions for "school books" subcategory
  const classOptions = normalizedSubcategory === "school books"
    ? (() => {
        const classes = originalBooks.map(book => book.Class);
        const cleanedClasses = classes.map(cls => cls ? cls.trim().toLowerCase() : "").filter(cls => cls !== "");
        const uniqueClasses = [...new Set(cleanedClasses)];
        return uniqueClasses.map(cls => cls.charAt(0).toUpperCase() + cls.slice(1));
      })()
    : [];

  const boardOptions = normalizedSubcategory === "school books"
    ? (() => {
        const boards = originalBooks.map(book => book.Board);
        const cleanedBoards = boards.map(board => board ? board.trim().toLowerCase() : "").filter(board => board !== "");
        const uniqueBoards = [...new Set(cleanedBoards)];
        return uniqueBoards.map(board => board.charAt(0).toUpperCase() + board.slice(1));
      })()
    : [];


  if (loading) {
    return (
      <div>
        <h1>
          <Load />
        </h1>
      </div>
    );
  }

  return (
    <>
      <FilterComponent
        books={originalBooks}
        onFilterChange={(filteredBooks) => setBook(filteredBooks)}
        subcategory={subcategory}
        classOptions={classOptions}
        boardOptions={boardOptions}
      />

      <div className="bookpage-div" style={{ marginLeft: "20%", marginTop: "2%" }}>
         <div className="booktype">
            {subcategory}
          </div>
        <section className="card-container">
            <ul className="cards" style={{ gridTemplateColumns: 'repeat(4, 230px)' }}>
              {book.length <= 0 ? (
                <div className="nobooks">
                  <h4>No Books In the Stock</h4>
                </div>
              ) : (
                book.map((book) => <Bookcard key={book._id} book={book} />)
              )}
            </ul>
          </section>
      </div>
    </>
  );
};
