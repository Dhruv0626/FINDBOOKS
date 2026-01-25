import { useState, useEffect } from "react";
import "../pages-css/AddCat.css";
import { useAlert } from "../Context/AlertContext";
import Cookies from "js-cookie";


export const AddCat = () => {
  const token = Cookies.get("token");
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [subcategoryName, setSubcategoryName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const { showAlert }  = useAlert();
 
  useEffect(() => {
    fetchCategories();
  }, []);

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

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/Category`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ Category_Name: categoryName })
      });
      if (response.ok) {
        showAlert("Category added successfully!","success");
        setCategoryName("");
        fetchCategories();
      } else {
        showAlert("Failed to add category.","error");
      }
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const handleAddSubcategory = async (e) => {
    e.preventDefault();
    if (!selectedCategory) {
      showAlert("Please select a category.","error");
      return;
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/Subcategory`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ Subcategory_Name: subcategoryName ,Category_id : selectedCategory })
      });
      if (response.ok) {
        showAlert("Subcategory added successfully!","success");
        setSubcategoryName("");
      } else {
        showAlert("Failed to add subcategory.","error");
      }
    } catch (error) {
      console.error("Error adding subcategory:", error);
    }
  };

  return (
    <div className="addcat-container fade-in">
      <h2 className="addcatform-header">Manage Categories & Subcategories</h2>
      
      <form onSubmit={handleAddCategory} className="addcat-form" noValidate>
        <br></br>
        <h3>Add Category</h3>
        <input
          type="text"
          placeholder="Enter Category Name"
          value={categoryName}
          className="uniform-input"
          onChange={(e) => setCategoryName(e.target.value)}
          required
        />
        <button type="submit" className="submit-button">Add Category</button>
      </form>

      {/* Add Subcategory Form */}
      <form onSubmit={handleAddSubcategory} className="addsubcat-form" noValidate>
        <br></br>
        <h3>Add Subcategory</h3>
        <br></br>
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="uniform-input" required>
          <option value="">Select Category</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>{category.Category_Name}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Enter Subcategory Name"
          value={subcategoryName}
          className="uniform-input"
          onChange={(e) => setSubcategoryName(e.target.value)}
          required
        />
       
        <button type="submit" className="submit-button">Add Subcategory</button>
        <br></br>
      </form>
    </div>
  );
};
