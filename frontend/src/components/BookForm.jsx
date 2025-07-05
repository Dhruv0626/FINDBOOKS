import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../components-css/BookForm.css";
import Cookies from "js-cookie";


export const BookForm = ({ UserRole }) => {
  const token = Cookies.get("token");

  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    BookName: "",
    image: null,
    Author: "",
    Edition: "",
    Publication_Date: "",
    Publisher: "",
    Description: "",
    Price: "",
    Quantity: "",  // Quantity for books
    ISBN: "",
    Condition: "",
    Category: "",
    SubCategory: "",
    Class: "",     // For School Books only
    Board: "",     // For School Books only
  });

  // Fetch Categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/Category`, {
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Subcategories when Category changes
  const handleCategoryChange = async (e) => {
    const categoryId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      Category: categoryId,
      SubCategory: "",
      Class: "",
      Board: "",
    }));
    setErrors((prevErrors) => ({
      ...prevErrors,
      Category: "",
      SubCategory: "",
      Class: "",
      Board: "",
    }));

    try {
      const response = await fetch(
        `${import.meta.env.VITE_RENDER_BACK}/api/${categoryId}/Subcategory`, {
        headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
      }
      );
      const data = await response.json();
      setSubcategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      setSubcategories([]);
    }
  };

  // Handle form input changes for text, select, number fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
  };

  // Handle image file input change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setErrors((prevErrors) => ({ ...prevErrors, image: "" }));
    }
  };

  // Helper to check if selected SubCategory is "School Books"
  const isSchoolBooks = () => {
    const subcat = subcategories.find((sc) => sc._id === formData.SubCategory);
    return subcat?.Subcategory_Name?.toLowerCase() === "school books";
  };

  // Form submission with validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};

    // Basic required fields validation
    if (!formData.BookName.trim())
      newErrors.BookName = "Book Name is required";
    if (!formData.image) newErrors.image = "Book image is required";
    if (!formData.Author.trim()) newErrors.Author = "Author is required";
    if (!formData.Publication_Date)
      newErrors.Publication_Date = "Publication Date is required";
    if (!formData.Publisher.trim()) newErrors.Publisher = "Publisher is required";
    if (!formData.Description.trim())
      newErrors.Description = "Description is required";
    if (!formData.Price || formData.Price <= 0)
      newErrors.Price = "Price must be greater than 0";
       if (!formData.Quantity || formData.Quantity <= 0)
      newErrors.Quantity = "Quantity must be greater than 0";
    if (!formData.ISBN.trim()) newErrors.ISBN = "ISBN is required";
    if (formData.ISBN.length !== 13)
      newErrors.ISBN = "ISBN code must be 13 digits";
    if (!formData.Condition) newErrors.Condition = "Condition is required";
    if (!formData.Category) newErrors.Category = "Category is required";
    if (!formData.SubCategory) newErrors.SubCategory = "Subcategory is required";
 

    // Conditional required fields for School Books
    if (isSchoolBooks()) {
      if (!formData.Class.trim()) newErrors.Class = "Class is required for School Books";
      if (!formData.Board.trim()) newErrors.Board = "Board is required for School Books";
    }

    setErrors(newErrors);

    // If no errors, proceed
    if (Object.keys(newErrors).length === 0) {
      navigate("/ResellerPaymentForm", { state: { bookData: formData, UserRole } });
    }
  };

return (
    <div className="book-form-container fade-in">
      <form onSubmit={handleSubmit} className="book-form" noValidate>
        <br></br>
        <div className="form-header">
          <h2>Book Form</h2>
        </div>

        <label>
          Book Name<span className="required">*</span>
        </label>
        <input
          type="text"
          name="BookName"
          value={formData.BookName}
          onChange={handleChange}
          className="uniform-input"
        />
        {errors.BookName && <p className="error-message">{errors.BookName}</p>}

        <label>
          Book Image<span className="required">*</span>
        </label>
        <input
          type="file"
          name="image"
          onChange={handleImageChange}
          accept="image/*"
          className="uniform-input"
        />
        {formData.image && (
          <img
            src={URL.createObjectURL(formData.image)}
            alt="Preview"
            className="image-preview"
          />
        )}
        {errors.image && <p className="error-message">{errors.image}</p>}

        <label>
          Author<span className="required">*</span>
        </label>
        <input
          type="text"
          name="Author"
          value={formData.Author}
          onChange={handleChange}
          className="uniform-input"
        />
        {errors.Author && <p className="error-message">{errors.Author}</p>}

        <label>
          Publication Date<span className="required">*</span>
        </label>
        <input
          type="date"
          name="Publication_Date"
          value={formData.Publication_Date}
          onChange={handleChange}
          className="uniform-input"
        />
        {errors.Publication_Date && (
          <p className="error-message">{errors.Publication_Date}</p>
        )}

        <label>Edition</label>
        <input
          type="text"
          name="Edition"
          value={formData.Edition}
          onChange={handleChange}
          className="uniform-input"
        />

        <label>
          Publisher<span className="required">*</span>
        </label>
        <input
          type="text"
          name="Publisher"
          value={formData.Publisher}
          onChange={handleChange}
          className="uniform-input"
        />
        {errors.Publisher && <p className="error-message">{errors.Publisher}</p>}

        <label>
          Description<span className="required">*</span>
        </label>
        <textarea
          name="Description"
          value={formData.Description}
          onChange={handleChange}
          className="uniform-input"
        />
        {errors.Description && <p className="error-message">{errors.Description}</p>}

        <label>
          Total Price<span className="required">*</span>
        </label>
        <input
          type="number"
          name="Price"
          value={formData.Price}
          onChange={handleChange}
          min="0.01"
          step="0.01"
          className="uniform-input"
        />
        {errors.Price && <p className="error-message">{errors.Price}</p>}

        <label>
          Quantity<span className="required">*</span>
        </label>
        <input
          type="number"
          name="Quantity"
          value={formData.Quantity}
          onChange={handleChange}
          min="1"
          className="uniform-input"
        />
        {errors.Quantity && <p className="error-message">{errors.Quantity}</p>}

        <label>
          ISBN No<span className="required">*</span>
        </label>
        <input
          type="text"
          name="ISBN"
          value={formData.ISBN}
          onChange={handleChange}
          maxLength="13"
          className="uniform-input"
        />
        {errors.ISBN && <p className="error-message">{errors.ISBN}</p>}

        <label>
          Condition<span className="required">*</span>
        </label>
        <select
          name="Condition"
          value={formData.Condition}
          onChange={handleChange}
          className="uniform-input"
        >
          <option value="">Select Condition</option>
          <option value="fair">Fair</option>
          <option value="good">Good</option>
          <option value="excellent">Excellent</option>
        </select>
        {errors.Condition && <p className="error-message">{errors.Condition}</p>}

        <label>
          Category<span className="required">*</span>
        </label>
        <select
          name="Category"
          value={formData.Category}
          onChange={handleCategoryChange}
          className="uniform-input"
        >
          <option value="">Select Category</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.Category_Name}
            </option>
          ))}
        </select>
        {errors.Category && <p className="error-message">{errors.Category}</p>}

        <label>
          Subcategory<span className="required">*</span>
        </label>
        <select
          name="SubCategory"
          value={formData.SubCategory}
          onChange={handleChange}
          className="uniform-input"
        >
          <option value="">Select Subcategory</option>
          {subcategories.map((subcategory) => (
            <option key={subcategory._id} value={subcategory._id}>
              {subcategory.Subcategory_Name}
            </option>
          ))}
        </select>
        {errors.SubCategory && <p className="error-message">{errors.SubCategory}</p>}

        {/* Conditionally show Class and Board fields if SubCategory is School Books */}
        {isSchoolBooks() && (
          <>
            <label>
              Class<span className="required">*</span>
            </label>
            <input
              type="text"
              name="Class"
              value={formData.Class}
              onChange={handleChange}
              className="uniform-input"
            />
            {errors.Class && <p className="error-message">{errors.Class}</p>}

            <label>
              Board<span className="required">*</span>
            </label>
            <input
              type="text"
              name="Board"
              value={formData.Board}
              onChange={handleChange}
              className="uniform-input"
            />
            {errors.Board && <p className="error-message">{errors.Board}</p>}
          </>
        )}

        <button type="submit" className="bookform-submit-button">
          Submit
        </button>
        <br></br>
      </form>
    </div>
  );
};
