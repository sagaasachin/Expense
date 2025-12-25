import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  Button,
  CircularProgress,
  useMediaQuery,
} from "@mui/material";

// Auto switch API between local & production
const API_BASE =
  import.meta.env.MODE === "development"
    ? "http://localhost:5000/api"
    : "https://expense-backend-z8da.onrender.com/api";

export default function OTPLogin({ children }) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isMobile = useMediaQuery("(max-width:600px)");
  const otpInputRef = useRef(null);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  // Autofocus OTP input
  useEffect(() => {
    if (step === "otp" && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  // Email validation
  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  // ---------------- SEND OTP ----------------
  const sendOTP = async () => {
    setErrorMsg("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) return setErrorMsg("Email is required");
    if (!isValidEmail(trimmedEmail)) return setErrorMsg("Enter a valid email");
    if (timeLeft > 0) return;

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/otp/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      setStep("otp");
      setOtp("");
      setTimeLeft(60);
    } catch (err) {
      setErrorMsg(err.message || "Server error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- VERIFY OTP ----------------
  const verifyOTP = async () => {
    setErrorMsg("");

    if (!otp) return setErrorMsg("Enter your OTP");
    if (otp.length !== 6) return setErrorMsg("OTP must be 6 digits");

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/otp/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "OTP verification failed");
      }

      if (data.success) {
        setVerified(true);
      } else {
        setErrorMsg(data.message || "Incorrect OTP");
      }
    } catch (err) {
      setErrorMsg(err.message || "Server error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (verified) return children;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        background: "linear-gradient(135deg, #1e3c72, #2a5298)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: isMobile ? 1.5 : 3,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: isMobile ? 330 : 380,
          borderRadius: "18px",
          boxShadow: "0 8px 26px rgba(0,0,0,0.25)",
        }}
      >
        <CardContent sx={{ textAlign: "center", p: isMobile ? 3 : 4 }}>
          <Typography
            variant={isMobile ? "h6" : "h5"}
            sx={{ mb: 1, fontWeight: 700 }}
          >
            🔐 Secure Login
          </Typography>

          <Typography
            sx={{
              mb: 3,
              color: "#ddd",
              fontSize: isMobile ? "13px" : "15px",
            }}
          >
            Enter your email to receive a login OTP
          </Typography>

          {errorMsg && (
            <Typography sx={{ color: "#ff9e9e", mb: 2, fontSize: 14 }}>
              {errorMsg}
            </Typography>
          )}

          {/* EMAIL STEP */}
          {step === "email" && (
            <>
              <TextField
                label="Email Address"
                type="email"
                fullWidth
                size="small"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 3 }}
              />

              <Button
                variant="contained"
                fullWidth
                onClick={sendOTP}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={26} sx={{ color: "white" }} />
                ) : (
                  "Send OTP"
                )}
              </Button>
            </>
          )}

          {/* OTP STEP */}
          {step === "otp" && (
            <>
              <TextField
                label="Enter OTP"
                type="text"
                fullWidth
                size="small"
                inputRef={otpInputRef}
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                sx={{ mb: 3 }}
              />

              <Button
                variant="contained"
                fullWidth
                onClick={verifyOTP}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={26} sx={{ color: "white" }} />
                ) : (
                  "Verify OTP"
                )}
              </Button>

              {timeLeft > 0 ? (
                <Typography sx={{ mt: 2, color: "#eee", fontSize: 14 }}>
                  Resend OTP in {timeLeft}s
                </Typography>
              ) : (
                <Button
                  variant="text"
                  sx={{ mt: 1, color: "#fff", textTransform: "none" }}
                  onClick={sendOTP}
                  disabled={loading}
                >
                  Resend OTP
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
