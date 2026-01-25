import { useState, useEffect } from 'react';
import { FaBars, FaShoppingCart, FaUserCircle } from 'react-icons/fa';
import { GiMagnifyingGlass } from "react-icons/gi";
import { GiBookmark } from "react-icons/gi";
import { MdCategory, MdLibraryBooks } from 'react-icons/md';
import { NavLink } from 'react-router-dom';
import { FaHome } from "react-icons/fa";
import '../components-css/Navbar.css';
import { Category } from "../pages/Category";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

export const Navbar = () => {
  const token = Cookies.get("token");
  const [menuActive, setMenuActive] = useState(false);
  const [showCategory, setShowCategory] = useState(false); // State to toggle Category visibility
  const [scrolling, setScrolling] = useState(false);
  const [role, setRole] = useState(null);
  const navigate = useNavigate();


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
      }
    };
    GetUser();
  }, []);


  const closeMenu = () => {
    setMenuActive(false); // Close menu when an item is clicked
  };

  const toggleMenu = () => {
    setMenuActive(!menuActive);
  };

  const handleLogout = () => {
    Cookies.remove('token');
  };

  const openCat = () => {
    setShowCategory(!showCategory); // Toggle the Category component visibility
    closeMenu();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const checkToken = () => {
    if (token) {
      navigate("/BookForm");
    } else {
      navigate("/login");
    }
  };

  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolling(true);
      } else {
        setScrolling(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const checkTokencart = () => {
    if (token) {
      // If token is available, navigate to the cart
      navigate("/cart");
    } else {
      // If no token, navigate to the login page
      navigate("/login");
    }
  };

  return (
    <>
      <div className='navbar-container'>
      <nav className={`navbar ${scrolling  ? 'scrolled' : ''}`}>
          <div className='webname-container'>
            <div className="mobile-menu-icon" onClick={toggleMenu}>
              <FaBars />
            </div>
            <img src='/findbook.png' className='logo-img' />
            <div className="appname"><NavLink to="/">FINDB<GiMagnifyingGlass className='glass' />OKS</NavLink></div>
          </div>
          <div className={`menulist ${menuActive ? 'active' : ''}`}>
            {role !== "Deliveryperson" &&
              <>
            <NavLink to="/"><FaHome /> Home</NavLink>
            <NavLink to="#" onClick={checkToken}>
              <MdLibraryBooks /> SellBooks
            </NavLink>
            <NavLink to="#" onClick={openCat}  ><GiBookmark /> Category</NavLink>
              <NavLink to="#" onClick={checkTokencart}><FaShoppingCart /> Cart</NavLink>
            </>
            }
            <NavLink to="/Profile"><FaUserCircle /> Profile</NavLink>
          </div>
          <div className='login'>
            {!token ? (<NavLink to="/login"><button className='login-btn'>Login</button></NavLink>)
              : (<NavLink to="/"><button className='login-btn' onClick={handleLogout}>Logout</button></NavLink>)}
          </div>
        </nav>
      </div>
      {showCategory && <Category />} {/* Conditionally render the Category component */}
    </>
  );
};
