import { useState, useEffect } from "react";
import "../components-css/BookForm.css";
import { useNavigate } from "react-router-dom";
import { useAlert } from "../Context/AlertContext";
import Cookies from "js-cookie";

export const AdminBookForm = ({ UserRole }) => {
  const token = Cookies.get("token");
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [errors, setErrors] = useState({});
  const { showAlert } = useAlert();

  const [formData, setFormData] = useState({
    BookName: "",
    image: null,
    Author: "",
    Edition: "",
    Publication_Date: "",
    Publisher: "",
    Description: "",
    Price: "",
    Quantity: "",
    ISBN: "",
    isold: "",
    Category: "",
    SubCategory: "",
    Board: "",
    Class: "",
  });

  const boardOptions = ["CBSE", "ICSE", "Other"];
  const classOptions = [
    "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6",
    "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};

    if (!formData.BookName.trim()) newErrors.BookName = "Book Name is required";
    if (!formData.Author.trim()) newErrors.Author = "Author is required";
    if (!formData.Edition.trim()) newErrors.Edition = "Edition is required";
    if (!formData.Publication_Date) newErrors.Publication_Date = "Publication Date is required";
    if (!formData.Publisher.trim()) newErrors.Publisher = "Publisher is required";
    if (!formData.Description.trim()) newErrors.Description = "Description is required";
    if (!formData.Price || formData.Price <= 0) newErrors.Price = "Price must be greater than 0";
    if (formData.Quantity === "" || formData.Quantity < 0) newErrors.Quantity = "Quantity must be a non-negative number";
    if (!formData.ISBN.trim()) newErrors.ISBN = "ISBN is required";
    if (!formData.Category) newErrors.Category = "Category is required";
    if (!formData.SubCategory) newErrors.SubCategory = "Subcategory is required";

    const selectedSubcategory = subcategories.find(
      (sub) => sub._id === formData.SubCategory
    );
    const subcategoryName = selectedSubcategory
      ? selectedSubcategory.Subcategory_Name.toLowerCase()
      : "";

    if (subcategoryName === "school books") {
      if (!formData.Board) newErrors.Board = "Board is required";
      if (!formData.Class) newErrors.Class = "Class is required";
    } else if (subcategoryName === "government exams") {
      if (!formData.State) newErrors.State = "State is required";
      if (!formData.Language) newErrors.Language = "Language is required";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        const formDataToSend = new FormData();
        for (const key in formData) {
          if (key === "Quantity") {
            formDataToSend.append(key, Number(formData[key]));
          } else if (key === "Board" || key === "Class") {
            if (formData[key] === "") {
              formDataToSend.append(key, null);
            } else {
              formDataToSend.append(key, formData[key]);
            }
          } else {
            formDataToSend.append(key, formData[key]);
          }
        }

        const response = await fetch(
          `${RENDER_BACK}/api/${UserRole}/Book`,
          {
            method: "POST",
            body: formDataToSend,
            credentials: "include",
            headers: {
              authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const json = await response.json();

        if (json.book) {
          showAlert("Book Added successfully!", "success");
          navigate("/Admin/ManageBooks");
        } else {
          showAlert(json.message || "Book not added", "error");
        }
      } catch (error) {
        console.error("Error occurred during submission:", error);
        showAlert("An error occurred. Please check the console for details.", "error");
      }
    }
  };

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

  const handleCategoryChange = async (e) => {
    const categoryId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      Category: categoryId,
      SubCategory: "",
      Board: "",
      Class: "",
    }));
    setErrors((prevErrors) => ({
      ...prevErrors,
      Category: "",
      SubCategory: "",
      Board: "",
      Class: "",
    }));

    try {
      const response = await fetch(
        `${RENDER_BACK}/api/${categoryId}/Subcategory`,
        {
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      setSubcategories(Array.isArray(data) ? data : []);
    } catch (error) {
      setSubcategories([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setFormData((prev) => ({ ...prev, image: file }));
  };

  const selectedSubcategory = subcategories.find(
    (sub) => sub._id === formData.SubCategory
  );
  const subcategoryName = selectedSubcategory
    ? selectedSubcategory.Subcategory_Name.toLowerCase()
    : "";

  return (
    <form onSubmit={handleSubmit} className="resellerbookform">
      <label>Book Name</label>
      <input
        type="text"
        name="BookName"
        value={formData.BookName}
        onChange={handleChange}
      />
      {errors.BookName && <p className="error-message">{errors.BookName}</p>}

      <label>Book Image</label>
      <input
        type="file"
        name="image"
        onChange={handleImageChange}
        accept="image/*"
      />
      {formData.image && (
        <img
          src={URL.createObjectURL(formData.image)}
          alt="Preview"
          style={{ maxWidth: "200px", maxHeight: "200px" }}
        />
      )}

      <label>Author</label>
      <input
        type="text"
        name="Author"
        value={formData.Author}
        onChange={handleChange}
      />
      {errors.Author && <p className="error-message">{errors.Author}</p>}

      <label>Publication Date</label>
      <input
        type="date"
        name="Publication_Date"
        value={formData.Publication_Date}
        onChange={handleChange}
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
      />
      {errors.Edition && <p className="error-message">{errors.Edition}</p>}

      <label>Publisher</label>
      <input
        type="text"
        name="Publisher"
        value={formData.Publisher}
        onChange={handleChange}
      />
      {errors.Publisher && <p className="error-message">{errors.Publisher}</p>}

      <label>Description</label>
      <textarea
        name="Description"
        value={formData.Description}
        onChange={handleChange}
      />
      {errors.Description && (
        <p className="error-message">{errors.Description}</p>
      )}

      <label>Price</label>
      <input
        type="number"
        name="Price"
        value={formData.Price}
        onChange={handleChange}
      />
      {errors.Price && <p className="error-message">{errors.Price}</p>}

      <label>ISBN No</label>
      <input
        type="text"
        name="ISBN"
        value={formData.ISBN}
        onChange={handleChange}
      />
      {errors.ISBN && <p className="error-message">{errors.ISBN}</p>}

      <label>Quantity</label>
      <input
        type="number"
        name="Quantity"
        value={formData.Quantity}
        onChange={handleChange}
        min="0"
      />
      {errors.Quantity && <p className="error-message">{errors.Quantity}</p>}

      <label>Category</label>
      <select
        name="Category"
        value={formData.Category}
        onChange={handleCategoryChange}
      >
        <option value="">Select Category</option>
        {categories.map((category) => (
          <option key={category._id} value={category._id}>
            {category.Category_Name}
          </option>
        ))}
      </select>
      {errors.Category && <p className="error-message">{errors.Category}</p>}

      <label>Subcategory</label>
      <select
        name="SubCategory"
        value={formData.SubCategory}
        onChange={handleChange}
      >
        <option value="">Select Subcategory</option>
        {subcategories.map((subcategory) => (
          <option key={subcategory._id} value={subcategory._id}>
            {subcategory.Subcategory_Name}
          </option>
        ))}
      </select>
      {errors.SubCategory && (
        <p className="error-message">{errors.SubCategory}</p>
      )}

      {subcategoryName === "school books" && (
        <>
          <label>Board</label>
          <select name="Board" value={formData.Board} onChange={handleChange}>
            <option value="">Select Board</option>
            {boardOptions.map((board) => (
              <option key={board} value={board}>
                {board}
              </option>
            ))}
          </select>
          {errors.Board && <p className="error-message">{errors.Board}</p>}

          <label>Class</label>
          <select name="Class" value={formData.Class} onChange={handleChange}>
            <option value="">Select Class</option>
            {classOptions.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
          {errors.Class && <p className="error-message">{errors.Class}</p>}
        </>
      )}

      <button type="submit" className="resellerbook-btn">
        Add Book
      </button>
    </form>
  );
};
