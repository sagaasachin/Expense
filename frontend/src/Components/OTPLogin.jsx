import React, { useState, useEffect } from "react";
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

const API_BASE = "https://expense-backend-z8da.onrender.com/api";

export default function OTPLogin({ children }) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isMobile = useMediaQuery("(max-width:600px)");

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  // Simple email validation
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Send OTP
  const sendOTP = async () => {
    setErrorMsg("");

    if (!email) return setErrorMsg("Email is required");
    if (!isValidEmail(email)) return setErrorMsg("Enter a valid email");
    if (timeLeft > 0) return; // prevent resending during countdown

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/otp/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setLoading(false);

      if (data.success) {
        setStep("otp");
        setTimeLeft(60);
      } else {
        setErrorMsg(data.message || "Failed to send OTP");
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg(
        "Server taking long to wake up (Render free tier). Try again."
      );
    }
  };

  // Verify OTP
  const verifyOTP = async () => {
    setErrorMsg("");

    if (!otp) return setErrorMsg("Enter your OTP");

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/otp/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      setLoading(false);

      if (data.success) {
        setVerified(true);
      } else {
        setErrorMsg("Incorrect OTP. Try again.");
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg("Server error. Please try again.");
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
          backdropFilter: "blur(12px)",
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

          {/* Error Message */}
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
                size={isMobile ? "medium" : "large"}
                onClick={sendOTP}
                disabled={loading}
                sx={{
                  py: isMobile ? 1 : 1.3,
                  fontSize: isMobile ? "14px" : "16px",
                }}
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
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                sx={{ mb: 3 }}
              />

              <Button
                variant="contained"
                fullWidth
                size={isMobile ? "medium" : "large"}
                onClick={verifyOTP}
                disabled={loading}
                sx={{
                  py: isMobile ? 1 : 1.3,
                  fontSize: isMobile ? "14px" : "16px",
                }}
              >
                {loading ? (
                  <CircularProgress size={26} sx={{ color: "white" }} />
                ) : (
                  "Verify OTP"
                )}
              </Button>

              {/* Timer / Resend */}
              {timeLeft > 0 ? (
                <Typography
                  sx={{
                    mt: 2,
                    color: "#eee",
                    fontSize: isMobile ? "13px" : "14px",
                  }}
                >
                  Resend OTP in {timeLeft}s
                </Typography>
              ) : (
                <Button
                  variant="text"
                  sx={{
                    mt: 1,
                    color: "#fff",
                    textTransform: "none",
                    fontSize: isMobile ? "14px" : "15px",
                    fontWeight: 600,
                  }}
                  onClick={sendOTP}
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
