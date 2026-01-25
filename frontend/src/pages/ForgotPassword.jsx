import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../pages-css/ForgotPassword.css";
import { useAlert } from "../Context/AlertContext";
import Cookies from "js-cookie";


function ForgotPassword() {
  const token = Cookies.get("token");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1);
  const [timer, setTimer] = useState(60);
  const [otpSent, setOtpSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false); // added loading state

  const navigate = useNavigate();
  const { showAlert } = useAlert();

  useEffect(() => {
    let countdown;
    if (otpSent && timer > 0) {
      countdown = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setOtpSent(false);
    }
    return () => clearInterval(countdown);
  }, [otpSent, timer]);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setEmailError("Email is required.");
      showAlert("Email is required.", "error");
      return;
    }

    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address.");
      showAlert("Please enter a valid email address.", "error");
      return;
    }

    setEmailError("");
    setSendingOtp(true);

    try {
      await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/${"forgotpassword"}/forgot-password`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      setStep(2);
      setOtpSent(true);
      setTimer(60);
      showAlert("OTP sent successfully", "success");
    } catch (error) {
      showAlert("Failed to send OTP. Please try again.", "error");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setOtpError("OTP is required.");
      showAlert("OTP is required.", "error");
      return;
    }

    setOtpError("");

    const res = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/verify-otp`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp }),
    });

    if (res.ok) {
      setStep(3);
    } else {
      showAlert("Invalid OTP", "error");
    }
  };

  const handleResendOtp = async () => {
    await handleSendOtp();
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      setPasswordError("New password is required.");
      showAlert("New password is required.", "error");
      return;
    }

    setPasswordError("");

    const response = await fetch(`${import.meta.env.VITE_RENDER_BACK}/api/reset-password`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, newPassword }),
    });

    const data = await response.json();
    if (data.message === "Password reset successfully") {
      showAlert("Password reset successfully!", "success");
      navigate("/login");
    } else {
      showAlert("Failed to reset password.", "error");
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div className="forgetcard-content">
          <h2 className="title">Forgot Password</h2>

          <input
            type="email"
            className={`input ${emailError ? "error" : ""}`}
            placeholder="Enter email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError("");
            }}
            disabled={step > 1}
          />
          {emailError && <p className="error-message">{emailError}</p>}

          {step === 1 && (
            <button
              className="forget-submit-button"
              onClick={handleSendOtp}
              disabled={sendingOtp}
            >
              {sendingOtp ? "Sending..." : "Send OTP"}
            </button>
          )}

          {step >= 2 && (
            <div className="otp-container">
              <p className="otp-label">Enter OTP</p>
              <input
                type="text"
                className={`otp-input ${otpError ? "error" : ""}`}
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value);
                  setOtpError("");
                }}
                disabled={step > 2}
              />
              {otpError && <p className="error-message">{otpError}</p>}

              {step === 2 && (
                <div>
                  <button className="forget-submit-button" onClick={handleVerifyOtp}>
                    Verify OTP
                  </button>
                  <button
                    className="forget-submit-button"
                    onClick={handleResendOtp}
                    disabled={timer > 0}
                  >
                    Resend OTP {timer > 0 && `(${timer}s)`}
                  </button>
                </div>
              )}
            </div>
          )}

          {step >= 3 && (
            <div>
              <input
                type="password"
                className={`input ${passwordError ? "error" : ""}`}
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordError("");
                }}
              />
              {passwordError && (
                <p className="error-message">{passwordError}</p>
              )}
              <button className="forget-submit-button" onClick={handleResetPassword}>
                Submit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
