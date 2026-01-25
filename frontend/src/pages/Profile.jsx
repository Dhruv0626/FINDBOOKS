import "../pages-css/Profile.css";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { Navbar } from "../components/Navbar";
import { ProfileMenu } from "../components/ProfileMenu";
import { useState, useEffect } from "react";
import { Plus, Mail, Phone, User, Calendar } from "lucide-react";
import Load from "../components/Load";

export const Profile = () => {
    const token = Cookies.get("token");
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const defaultImage = "/src/images/profile.png"; 

    // ✅ Profile Image State
    const [image, setImage] = useState(defaultImage);

    // 🟢 Fetch User Profile Data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/profile`, {
                    credentials: "include",
                    headers: {
                        authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                });
                const json = await response.json();


                if (!json.user) {
                    console.warn("No user data received. Displaying guest mode.");
                    setUser(null);
                    setImage(defaultImage);
                } else {
                    setUser(json.user);

                    // 🔄 Retrieve Base64 image from localStorage
                    const storedImage = localStorage.getItem(`profileImage_${json.user.Email}`);
                    setImage(storedImage || defaultImage);
                }
            } catch (error) {
                console.error("Error fetching profile data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    // 🔵 Handle Profile Image Change (Store in Base64 format)
    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file && user) { // Ensure user exists
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result;
                localStorage.setItem(`profileImage_${user.Email}`, base64String); // Store image per user
                setImage(base64String);
            };
            reader.readAsDataURL(file); // Convert file to Base64
        }
    };

    // 🔴 Handle Logout
    const handleLogout = () => {
        Cookies.remove("token");
        setUser(null);
        setImage(defaultImage); // Reset to default image
        navigate("/");
    };

    // ⏳ Show Loading Spinner While Fetching Data
    if (loading) {
        return (
            <>
                <Navbar />
                <div className="profile-container">
                    <ProfileMenu />
                    <div className="profile-page">
                        <Load />
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="profile-container">
                <ProfileMenu />
                <div className="profile-page">
                    <header className="profile-header">
                        <h1>My Profile</h1>
                        <p className="profile-subtitle">
                            Manage your account settings and preferences
                        </p>
                    </header>

                    <section className="profile-details">
                        {/* Profile Image Section */}

                        <div className="profile-image-section">
                            <div className="profile-image-container">
                                <img
                                    src={image}
                                    alt="Profile"
                                    className="profile-image"
                                />
                                {user && ( // Only allow image change if logged in
                                    <label className="upload-button" title="Change profile picture">
                                        <Plus size={16} />
                                        <input
                                            type="file"
                                            id="imageUpload"
                                            className="file-input"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                        />
                                    </label>
                                )}
                            </div>
                            <h2 className="profile-name">
                                {user ? `${user.First_name}` : "Guest"}
                            </h2>
                            <p className="profile-role">
                                {user?.Role || "Guest User"}
                            </p>
                        </div>

                        {/* Personal Info Section */}
                        <div className="profile-info">
                            <div className="info-section">
                                <h3>Personal Information</h3>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <Mail className="info-icon" />
                                        <div className="info-content">
                                            <label>Email Address</label>
                                            <span>{user?.Email || "Not provided"}</span>
                                        </div>
                                    </div>
                                    <div className="info-item">
                                        <Phone className="info-icon" />
                                        <div className="info-content">
                                            <label>Mobile Number</label>
                                            <span>{user?.Phone_no || "Not provided"}</span>
                                        </div>
                                    </div>
                                    <div className="info-item">
                                        <User className="info-icon" />
                                        <div className="info-content">
                                            <label>Account Type</label>
                                            <span>{user?.Role || "Guest User"}</span>
                                        </div>
                                    </div>
                                    <div className="info-item">
                                        <Calendar className="info-icon" />
                                        <div className="info-content">
                                            <label>Member Since</label>
                                            <span>
                                                {user?.createdAt
                                                    ? new Date(user.createdAt).toLocaleDateString()
                                                    : "Not available"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Action Buttons */}
                    <div className="profile-actions">
                        {user ? (
                            <>
                                <button
                                    className="edit-btn"
                                    onClick={() => navigate("/EditProfile", { state: { user } })}
                                    title="Edit your profile information"
                                >
                                    Edit Profile
                                </button>
                                <button
                                    className="log-out-btn"
                                    onClick={handleLogout}
                                    title="Log out of your account"
                                >
                                    Log Out
                                </button>
                            </>
                        ) : (
                            <button
                                className="profilelogin-btn"
                                onClick={() => navigate("/login")}
                                title="Log in to your account"
                            >
                                Log In
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
