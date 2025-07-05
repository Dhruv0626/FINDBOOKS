import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../pages-css/AdminAddUser.css";
import { useAlert } from "../Context/AlertContext";
import Cookies from "js-cookie";

export const AdminEditUser = () => {
  const token = Cookies.get("token");
  const navigate = useNavigate();
  const location = useLocation();
  const { User } = location.state || {}; // Extract User object from location state
    const {showAlert} = useAlert();


  // Initialize user state with received data (or empty fields if not found)
  const [user, setUser] = useState({
    id : "",
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    role: "",
  });

  // Update state when User is available
  useEffect(() => {
    if (User) {
      setUser({
        id : User._id,
        firstName: User.First_name || "",
        lastName: User.Last_name || "",
        email: User.Email || "",
        mobile: User.Phone_no || "", // Keep empty for security reasons
        role: User.Role,
      });
    }
  }, [User]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const editUser = async (e) => {
    e.preventDefault();
  
  
    if (!user.id) {
      showAlert("User ID is missing. Cannot update.","error");
      return;
    }
  
    try {
      const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/User`, {
        method: "PUT",
        headers: {
          authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userId: user.id, 
          firstname: user.firstName,
          lastname : user.lastName,  
          email: user.email,
          mobile: user.mobile,
          role: user.role,
        }),
      });
  
  
      const result = await response.json();
  
      if (response.ok) {
        showAlert("User updated successfully!","success");
        navigate("/Admin/ManageUsers");
      } else {
        showAlert(result.error || "Failed to update user.","error");
      }
    } catch (error) {
      console.error("Error in try block:", error);
      showAlert("An error occurred.","error");
    }
  };
  
  
  return (
    <div className="add-user-container">
      <h2 className="form-title">Edit User</h2>
      <form className="add-user-form" onSubmit={editUser}>
        <div className="form-group">
          <br></br>
          <label>First Name:</label>
          <input type="text" name="firstName" value={user.firstName} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Last Name:</label>
          <input type="text" name="lastName" value={user.lastName} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Email:</label>
          <input type="email" name="email" value={user.email} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Mobile No:</label>
          <input type="tel" name="mobile" value={user.mobile} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Role:</label>
          <select name="role" value={user.role} onChange={handleChange} required>
            <option value="">Select Role</option>
            <option value="User">User</option>
            <option value="Admin">Admin</option>
            <option value="Deliveryperson">DeliveryPerson</option>
          </select>
        </div>

        <button type="submit" className="submit-button">
          Update User Data
        </button>
        <br></br>
      </form>
    </div>
  );
};
