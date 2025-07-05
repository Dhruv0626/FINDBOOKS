import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Cookies from "js-cookie";
import "../pages-css/Login.css";
import { useAlert } from "../Context/AlertContext";

export const Login = () => {
  const token = Cookies.get("token");
  const [isPanelActive, setIsPanelActive] = useState(false);
  const [errors, setErrors] = useState({});
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [verified, setVerified] = useState(false);
  const [showVerifyMessage, setShowVerifyMessage] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  const [Regcredentials, SetRegcredentials] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
  });

  const [Logcredentials, Setlogcredentials] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  //Send OTP Back API in Auth Router
  const handleSendOtp = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!Regcredentials.email) {
      showAlert("please enter your email address", "error");
      return;
    } else if (!isValidEmail(Regcredentials.email)) {
      showAlert("Please enter valid email address.", "error");
      return;
    }

    setSendingOtp(true); // Start loading
    try {
      const response = await fetch(
        `${import.meta.env.VITE_RENDER_BACK}/api/registerotp`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: Regcredentials.email }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send OTP.");
      } else {
        setStep(2);
        showAlert("OTP sent successfully. Please check your email.", "success");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      showAlert("Error sending OTP. Please try again later.", "error");
    } finally {
      setSendingOtp(false); // Stop loading
    }
  };

  //Verify OTP Back API in Auth Router
  const handleVerifyOtp = async () => {
    if (!Regcredentials.email || !otp) {
      showAlert("Please enter both email and OTP.", "error");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_RENDER_BACK}/api/verifyotp`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: Regcredentials.email, otp }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "OTP verification failed.");
      } else {
        setVerified(true);
        setStep(3); // Proceed to next step
      }

      showAlert("OTP verified successfully.", "success");
      setStep(3); // Proceed to next step
    } catch (error) {
      console.error("Error verifying OTP:", error);
      showAlert(error.message, "error");
    }
  };

  //Registration Validation
  const validateRegistration = () => {
    const newErrors = {};

    // First Name validation
    if (Regcredentials.firstName.trim().length < 2) {
      newErrors.firstName =
        "First name is required and must be at least 2 characters";
    }

    // Last Name validation
    if (Regcredentials.lastName.trim().length < 2) {
      newErrors.lastName =
        "Last name is required and must be at least 2 characters";
    }

    // Email validation
    if (!Regcredentials.email.toLowerCase().endsWith("@gmail.com")) {
      newErrors.email = "Please enter a valid Gmail address";
    }

    // Mobile validation
    if (!/^\d{10}$/.test(Regcredentials.mobile)) {
      newErrors.mobile = "Mobile number must be exactly 10 digits";
    }

    // Password validation
    if (Regcredentials.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  //Login Validation
  const validateLogin = () => {
    const newErrors = {};

    // Email validation
    if (!Logcredentials.email.toLowerCase().endsWith("@gmail.com")) {
      newErrors.loginEmail = "Invalid Credentials ";
    }

    // Password validation
    if (Logcredentials.password.length < 6) {
      newErrors.loginPassword = "Invalid Credentials";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  //Registration Back API in Auth Router
  const handleReg = async (e) => {
    e.preventDefault();

    if (!verified) {
      setShowVerifyMessage(true);
      return;
    }

    if (!validateRegistration()) {
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_RENDER_BACK}/api/User`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(Regcredentials),
          credentials: "include",
        }
      );

      const json = await response.json();

      if (json.authtoken) {
        Cookies.set("token", json.authtoken);
        showAlert("Registered successfully!", "success");
        navigate("/");
      } else {
        showAlert(json.message || "Registration failed", "error");
      }
    } catch (error) {
      showAlert("An error occurred. Please try again later.", "error");
      console.error(error);
    }
  };

  //Login Back API in Auth Router
  const HandleLog = async (e) => {
    e.preventDefault();

    if (!validateLogin()) {
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_RENDER_BACK}/api/login`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(Logcredentials),
          credentials: "include",
        }
      );

      const json = await response.json();

      if (json.success && json.authtoken) {
        Cookies.set("token", json.authtoken);
        showAlert("Login successful!", "success");

        if (json.user.Role === "Deliveryperson" || json.user.Role === "Admin") {
          navigate("/profile");
        } else {
          navigate("/");
        }
      } else {
        showAlert("Invalid credentials", "error");
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  //onChange event for Ragistration
  const RegChange = (e) => {
    const { name, value } = e.target;
    SetRegcredentials((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  //onChange event for Login
  const LogChange = (e) => {
    const { name, value } = e.target;
    Setlogcredentials((prev) => ({ ...prev, [name]: value }));

    if (errors[`login${name.charAt(0).toUpperCase() + name.slice(1)}`]) {
      setErrors((prev) => ({
        ...prev,
        [`login${name.charAt(0).toUpperCase() + name.slice(1)}`]: "",
      }));
    }
  };

  return (
    <div
      className={`container ${isPanelActive ? "right-panel-active" : ""}`}
      id="container"
    >
      <div className="form-container sign-up-container">
        <form
          onSubmit={handleReg}
          style={{
            paddingTop: "5vh",
            backgroundColor: "white",
            paddingBottom: "",
          }}
        >
          <br />
          <br />
          <br />
          <h1>Registration</h1>
          <br />
          {/* <div className="social-container">
          {/* <a href="#" className="social">
            <i className="fab fa-facebook-f"></i>
          </a>
          <a href="#" className="social">
            <i className="fab fa-google-plus-g"></i>
          </a>
          <a href="#" className="social">
            <i className="fab fa-linkedin-in"></i>
          </a>
        </div> */}
          <span>or use your email for registration</span>
          <div className="input-group">
            <input
              type="text"
              name="firstName"
              id="firstName"
              placeholder="First name"
              value={Regcredentials.firstName}
              onChange={RegChange}
              className={errors.firstName ? "error" : ""}
            />
            {errors.firstName && (
              <span className="error-message">{errors.firstName}</span>
            )}
          </div>
          <div className="input-group">
            <input
              type="text"
              name="lastName"
              id="lastName"
              placeholder="Last name"
              value={Regcredentials.lastName}
              onChange={RegChange}
              className={errors.lastName ? "error" : ""}
            />
            {errors.lastName && (
              <span className="error-message">{errors.lastName}</span>
            )}
          </div>
          <div className="input-group">
            <input
              type="email"
              name="email"
              id="email"
              placeholder="Email"
              value={Regcredentials.email}
              onChange={RegChange}
              className={errors.email ? "error" : ""}
            />
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}

            {step === 1 && (
              <button
                onClick={handleSendOtp}
                className="reg-button"
                disabled={sendingOtp}
              >
                {sendingOtp ? "Sending..." : "Send OTP"}
              </button>
            )}

            {step === 2 && !verified && (
              <div className="otp-container">
                <p className="otp-label">Enter OTP</p>
                <input
                  type="text"
                  className="otp-input"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <div>
                  <button className="reg-button" onClick={handleVerifyOtp}>
                    Verify OTP
                  </button>
                </div>
              </div>
            )}

            {verified ? (
              <div className="otp-success">
                <p className="success-message">Email Verified Successfully!</p>
              </div>
            ) : (
              <div className="delivery-confirmation">
                {showVerifyMessage && (
                  <p className="error-message">
                    Please verify your email before registering.
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="input-group">
            <input
              type="text"
              name="mobile"
              id="mobile"
              placeholder="Mobile No"
              value={Regcredentials.mobile}
              onChange={RegChange}
              className={errors.mobile ? "error" : ""}
              maxLength="10"
            />
            {errors.mobile && (
              <span className="error-message">{errors.mobile}</span>
            )}
          </div>
          <div className="input-group">
            <input
              type="password"
              name="password"
              id="password"
              placeholder="Password"
              value={Regcredentials.password}
              onChange={RegChange}
              className={errors.password ? "error" : ""}
            />
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
          </div>
          <button className="reg-button">Register</button>
          <br />
          <br />
          <br />
        </form>
      </div>

      <div className="form-container sign-in-container">
        <form onSubmit={HandleLog}>
          <h1>Login</h1>
          <br />
          {/* <div className="social-container">
          {/* <a href="#" className="social">
            <i className="fab fa-facebook-f"></i>
          </a>
          <a href="#" className="social">
            <i className="fab fa-google-plus-g"></i>
          </a>
          <a href="#" className="social">
            <i className="fab fa-linkedin-in"></i>
          </a>
        </div> */}
          <span>or use your account</span>
          <div className="input-group">
            <input
              type="email"
              name="email"
              id="email2"
              placeholder="Email"
              value={Logcredentials.email}
              onChange={LogChange}
              className={errors.loginEmail ? "error" : ""}
            />
            {errors.loginEmail && (
              <span className="error-message">{errors.loginEmail}</span>
            )}
          </div>
          <div className="input-group">
            <input
              type="password"
              name="password"
              id="password2"
              placeholder="Password"
              value={Logcredentials.password}
              onChange={LogChange}
              className={errors.loginPassword ? "error" : ""}
            />
            {errors.loginPassword && (
              <span className="error-message">{errors.loginPassword}</span>
            )}
          </div>
          <p className="forget">
            <Link to="/ForgotPassword">Forgot your password?</Link>
          </p>
          <br />
          <button className="log-button">Login</button>
        </form>
      </div>

      <div className="overlay-container">
        <div className="overlay">
          <div className="overlay-panel overlay-left">
            <h1>Welcome Back!</h1>
            <br />
            <p>
              To keep connected with us please login with your personal info
            </p>
            <br />
            <button
              className="ghost"
              id="signIn"
              onClick={() => setIsPanelActive(false)}
            >
              Login
            </button>
          </div>
          <div className="overlay-panel overlay-right">
            <h1>Hello, Friend!</h1>
            <br />
            <p>Enter your personal details and start your journey with us</p>
            <br />
            <button
              className="ghost"
              id="signUp"
              onClick={() => setIsPanelActive(true)}
            >
              Registration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
