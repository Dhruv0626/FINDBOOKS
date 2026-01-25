import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../components-css/ProfileMenu.css";
import Load from "../components/Load";
import { MdDashboard } from "react-icons/md";
import { ImBooks } from "react-icons/im";
import { MdOutlineSell } from "react-icons/md";
import { CgProfile } from "react-icons/cg";
import { FaUserCircle } from 'react-icons/fa';
import Cookies from "js-cookie";


export function ProfileMenu() {
    const token = Cookies.get("token");
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const GetUser = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/User`, {
                    credentials: "include",
                    headers: {
                        authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                const json = await response.json();
                const roles = json.user.Role || [];
                setRole(roles);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        GetUser();
    }, []);

    const handleAdminClick = (e) => {
        if (role === "Admin") {
            e.preventDefault();
            navigate("/Admin");
        }
    };
    
    const handleDeliveryClick = (e) => {
        if (role === "Deliveryperson") {
            e.preventDefault();
            navigate("/deliverydashboard");
        }
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    if (loading) {
        return <Load />;
    }

    return (
        <div className="side-menu">
            <h3 className="menu-title">
                <FaUserCircle /> My Account
            </h3>
            <ul>
                {role === "Deliveryperson" ? (
                    <li className="menu-item">
                        <Link
                            to="/deliverydashboard"
                            onClick={handleDeliveryClick}
                            className={isActive("/deliverydashboard") ? "active" : ""}
                        >
                            <MdDashboard /> Delivery Dashboard
                        </Link>
                    </li>
                ) : (
                    <>
                        {role === "Admin" && (
                            <li className="menu-item">
                                <Link
                                    to="/Admin"
                                    onClick={handleAdminClick}
                                    className={isActive("/Admin") ? "active" : ""}
                                >
                                    <MdDashboard /> Dashboard
                                </Link>
                            </li>
                        )}
                        <li className="menu-item">
                            <Link
                                to="/Profile"
                                className={isActive("/Profile") ? "active" : ""}
                            >
                                <CgProfile /> My Profile
                            </Link>
                        </li>
                        <li className="menu-item">
                            <Link
                                to="/Orders"
                                className={isActive("/Orders") ? "active" : ""}
                            >
                                <ImBooks /> Orders
                            </Link>
                        </li>
                        <li className="menu-item">
                            <Link
                                to="/Sellorders"
                                className={isActive("/Sellorders") ? "active" : ""}
                            >
                                <MdOutlineSell /> Sell Orders
                            </Link>
                        </li>
                    </>
                )}
            </ul>
        </div>
    );
};

