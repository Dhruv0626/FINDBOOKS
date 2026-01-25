import { useState } from "react";
import "../pages-css/AdminAddUser.css";
import { useNavigate } from "react-router-dom";
import { useAlert } from "../Context/AlertContext";
import Cookies from "js-cookie";


export const AdminAddUser = () => {
  const token = Cookies.get("token");
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
    role: "",
  });

  const [errors, setErrors] = useState({});
  const Navigate = useNavigate();
  const { showAlert } = useAlert();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" })); // clear error on change
  };

  const validateForm = () => {
    const newErrors = {};

    if (!user.firstName.trim()) newErrors.firstName = "First name is required.";
    if (!user.lastName.trim()) newErrors.lastName = "Last name is required.";
    if (!user.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(user.email)) {
      newErrors.email = "Email is invalid.";
    }

    if (!user.mobile.trim()) {
      newErrors.mobile = "Mobile number is required.";
    } else if (!/^\d{10}$/.test(user.mobile)) {
      newErrors.mobile = "Mobile number must be 10 digits.";
    }

    if (!user.password.trim()) {
      newErrors.password = "Password is required.";
    } else if (user.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    if (!user.role.trim()) newErrors.role = "Role is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;


    try {
      const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/User`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });

      const result = await response.json();

      if (response.ok) {
        showAlert("User added successfully!", "success");
        setUser({
          firstName: "",
          lastName: "",
          email: "",
          mobile: "",
          password: "",
          role: "",
        });
        Navigate("/Admin/ManageUsers");
      } else {
        showAlert(result.error || "Failed to add user.", "error");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      showAlert("An error occurred while adding the user.", "error");
    }
  };

  return (
    <div className="add-user-container">
      <h2 className="form-title">Add New User</h2>
      <form className="add-user-form" onSubmit={handleSubmit} noValidate>
        <br></br>
        <label>
          First Name:
          <input type="text" name="firstName" value={user.firstName} onChange={handleChange} className="uniform-input" />
          {errors.firstName && <p className="error-message">{errors.firstName}</p>}
        </label>

        <label>
          Last Name:
          <input type="text" name="lastName" value={user.lastName} onChange={handleChange} className="uniform-input" />
          {errors.lastName && <p className="error-message">{errors.lastName}</p>}
        </label>

        <label>
          Email:
          <input type="email" name="email" value={user.email} onChange={handleChange} className="uniform-input" />
          {errors.email && <p className="error-message">{errors.email}</p>}
        </label>

        <label>
          Mobile No:
          <input type="tel" name="mobile" value={user.mobile} onChange={handleChange} className="uniform-input" />
          {errors.mobile && <p className="error-message">{errors.mobile}</p>}
        </label>

        <label>
          Password:
          <input type="password" name="password" value={user.password} onChange={handleChange} className="uniform-input" />
          {errors.password && <p className="error-message">{errors.password}</p>}
        </label>

        <label>
          Role:
          <select name="role" value={user.role} onChange={handleChange} className="uniform-input">
            <option value="">Select Role</option>
            <option value="User">User</option>
            <option value="Admin">Admin</option>
            <option value="Deliveryperson">Deliveryperson</option>
          </select>
          {errors.role && <p className="error-message">{errors.role}</p>}
        </label>

        <button type="submit" className="submit-button">Add User</button>
        <br></br>
      </form>
    </div>
  );
};
