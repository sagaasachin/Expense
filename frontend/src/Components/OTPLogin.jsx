import React, { useState, useEffect } from "react";

export default function OTPLogin({ children }) {
  const [step, setStep] = useState("email"); // email → otp → success
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  // SEND OTP
  const sendOTP = async () => {
    if (!email) return alert("Enter email");

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/otp/send-otp", {
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
        alert(data.message || "Failed to send OTP");
      }
    } catch (err) {
      setLoading(false);
      alert("Server error. Check backend.");
    }
  };

  // VERIFY OTP
  const verifyOTP = async () => {
    if (!otp) return alert("Enter OTP");

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/otp/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      setLoading(false);

      if (data.success) {
        setVerified(true);
      } else {
        alert(data.message || "Incorrect OTP");
      }
    } catch (err) {
      setLoading(false);
      alert("Server error. Check backend.");
    }
  };

  // If OTP verified → show the protected app
  if (verified) return children;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* EMAIL INPUT */}
        {step === "email" && (
          <>
            <h2>🔐 Login with Email OTP</h2>

            <input
              type="email"
              placeholder="Enter your email"
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button style={styles.button} onClick={sendOTP} disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </>
        )}

        {/* OTP INPUT */}
        {step === "otp" && (
          <>
            <h2>📩 Enter the OTP</h2>

            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              style={styles.input}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <button
              style={styles.button}
              onClick={verifyOTP}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            {/* TIMER */}
            {timeLeft > 0 ? (
              <p style={{ marginTop: "10px" }}>Resend OTP in {timeLeft}s</p>
            ) : (
              <button
                style={styles.resendButton}
                onClick={sendOTP}
                disabled={loading}
              >
                Resend OTP
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---------------- STYLES ----------------
const styles = {
  container: {
    height: "100vh",
    background: "linear-gradient(to bottom, #283048, #859398)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    background: "white",
    padding: "25px",
    borderRadius: "14px",
    width: "300px",
    textAlign: "center",
    boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
  },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid gray",
    marginTop: "12px",
    fontSize: "18px",
  },
  button: {
    width: "100%",
    padding: "12px",
    marginTop: "15px",
    background: "#283048",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "18px",
    cursor: "pointer",
  },
  resendButton: {
    marginTop: "10px",
    background: "transparent",
    border: "none",
    color: "#283048",
    fontSize: "16px",
    cursor: "pointer",
  },
};
