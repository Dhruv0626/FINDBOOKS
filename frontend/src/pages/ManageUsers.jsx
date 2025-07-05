import { useState, useEffect } from "react";
import "../pages-css/ManageUsers.css";
import { useNavigate } from "react-router-dom";
import { useAlert } from "../Context/AlertContext";
import Cookies from "js-cookie";

export const ManageUsers = () => {
  const token = Cookies.get("token");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const navigate = useNavigate();
  
        const {showAlert} = useAlert();


  useEffect(() => {
    const GetUsers = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACK_URL}/api/AllUser`, {
          credentials: "include",
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const json = await response.json();
        setUsers(json.users);
        setFilteredUsers(json.users); // Initialize with all users
      } catch (error) {
        showAlert("An error occurred. Please try again later.","error");
        console.error(error);
      }
    };
    GetUsers();
  }, []);

  useEffect(() => {
    if (search.trim() === "") {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(
        users.filter((user) =>
          user.First_name.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search, users]);
  
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
  
    try {
      const response = await fetch(`${import.meta.env.VITE_BACK_URL}/api/User`, {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ userId: id }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        setUsers(users.filter((user) => user._id !== id));
        setFilteredUsers(filteredUsers.filter((user) => user._id !== id));
        showAlert("User deleted successfully!","success");
      } else {
        showAlert(data.error || "Failed to delete user","error");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      showAlert("An error occurred. Please try again later.","error");
    }
  };
  

  const handleEdit = (User) => {
    navigate("/Admin/ManageUsers/EditUser", {state : {User} });
  };


  return (
    <div className="users-page">
      <h1 className="title">Users Management</h1>
      <div className="users-card">
        <div className="card-content">
          <div className="header">
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <button className="add-user" onClick={()=> navigate("/Admin/ManageUsers/adduser")}>
              Add User
            </button>
          </div>
          <table className="user-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr key={user._id} className="user-row centered">
                  <td className="centered">{index + 1}</td>
                  <td className="centered">
                    {user.First_name} {user.Last_name}
                  </td>
                  <td className="centered">{user.Email}</td>
                  <td className="centered">
                    {user.Role}
                  </td>
                  <td className="centered">
                    <div className="actions centered">
                      <button
                        className="edit-btn centered"
                        onClick={() => handleEdit(user)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-btn centered"
                        onClick={() => handleDelete(user._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};