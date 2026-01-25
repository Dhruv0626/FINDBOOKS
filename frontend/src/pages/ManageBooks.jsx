import { useState, useEffect } from "react";
import "../pages-css/ManageBooks.css";
import { useNavigate } from "react-router-dom";
import { useAlert } from "../Context/AlertContext";
import Cookies from "js-cookie";
import {formatIndianNumber} from "../utils/formatIndianNumber"

export const ManageBooks = () => {
  const token = Cookies.get("token");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [bookdata, setBookdata] = useState([]);
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const fetchBook = async () => {
    try {
      const bookRes = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/Book`, {
        headers: {
          authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const bookData = await bookRes.json();

      if (!Array.isArray(bookData)) {
        console.warn("Expected an array but got:", bookData);
        setBookdata([]);
        return;
      }

      setBookdata(bookData);
    } catch (error) {
      console.error("Fetch Error:", error);
      setBookdata([]);
    }
  };

  useEffect(() => {
    fetchBook();
  }, []);

  const redirectBook = () => {
    navigate("/Admin/ManageBooks/AddBook");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this book?")) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/Book`, {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookId: id }),
        credentials: "include",
      });

      const result = await response.json();

      if (response.ok) {
        showAlert("Book deleted successfully", "success");
        setBookdata(bookdata.filter((book) => book._id !== id));
      } else {
        showAlert(result.error || "Failed to delete the book.", "error");
      }
    } catch (error) {
      console.error("Error deleting book:", error);
      showAlert("An error occurred while deleting the book.", "error");
    }
  };

  const handleEdit = async (product) => {
    navigate("/Admin/ManageBooks/EditBooks", { state: { product } });
  };

  return (
    <div className="products-page">
      <h1 className="title">Products Management</h1>
      <div className="books-card">
        <div className="card-content">
          <div className="header">
            <input
              type="text"
              placeholder="Search products..."
              className="search-input centered"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <br></br>
            <button className="add-product centered" onClick={redirectBook}>
              Add Books
            </button>
          </div>
          <table className="product-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Name</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>ISBN</th>
                <th>Author</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(bookdata) && bookdata.length > 0 ? (
                bookdata
                  .filter((book) =>
                    book.BookName.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((product, index) => {
                    const isReselling = product.Condition ? true : false;
                    return (
                      <tr key={product._id} className="product-row">
                        <td className="centered">{index + 1}</td>
                        <td>
                          <img
                            src={product.BookImageURL}
                            alt={product.BookName.length > 15
                            ? product.BookName.slice(0, 15) + "..."
                            : product.BookName}
                            className="bookImage"
                          />
                        </td>
                        <td className="centered">
                          {product.BookName.length > 15
                            ? product.BookName.slice(0, 15) + "..."
                            : product.BookName}
                        </td>
                        <td className="centered">₹{formatIndianNumber(product.Price)}</td>
                        <td className="centered">{product.Quantity}</td>
                        <td className="centered">{product.ISBN}</td>
                        <td className="centered">{product.Author}</td>
                        <td className="centered">
                          {isReselling ? (
                            <div className="resell-strip">Resell Book</div>
                          ) : (
                            <div className="actions centered">
                              <button
                                className="edit-btn centered"
                                onClick={() => handleEdit(product)}
                              >
                                Edit
                              </button>
                              <button
                                className="delete-btn centered"
                                onClick={() => handleDelete(product._id)}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
              ) : (
                <tr>
                  <td colSpan="8" className="centered">
                    No books available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
