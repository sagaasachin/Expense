import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// In-memory OTP store
let otpStore = {};

// -------------------- MAIL SETUP -------------------------
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // use STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});


// Verify transporter on startup
transporter.verify((err) => {
  if (err) {
    console.error("❌ Mail transporter error:", err.message);
  } else {
    console.log("✅ Mail transporter ready");
  }
});

// -------------------- OTP GENERATOR ----------------------
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
console.log("🔥 /send-otp route hit");

// -------------------- SEND OTP ---------------------------
export async function sendOTP(req, res) {
  console.log("🔥 /send-otp route hit");

  try {
    const { email } = req.body;
    console.log("📩 OTP request for:", email);

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const otp = generateOTP();
    const expireMs = parseInt(process.env.OTP_EXPIRE_MS) || 120000;

    otpStore[email] = {
      otp,
      expiresAt: Date.now() + expireMs,
    };

    await transporter.sendMail({
      from: `"Expense App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It expires in 2 minutes.`,
    });

    console.log("✅ OTP sent to:", email);

    return res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("❌ Send OTP Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send OTP",
    });
  }
}

// -------------------- VERIFY OTP -------------------------
export function verifyOTP(req, res) {
  try {
    const { email, otp } = req.body;
    console.log("🔎 Verifying OTP for:", email);

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const record = otpStore[email];

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or not found",
      });
    }

    if (Date.now() > record.expiresAt) {
      delete otpStore[email];
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    if (record.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    delete otpStore[email];
    console.log("✅ OTP verified for:", email);

    return res.json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("❌ Verify OTP Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "OTP verification failed",
    });
  }
}
