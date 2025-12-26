import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

// -------------------- OTP GENERATOR ----------------------
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// In-memory OTP store
let otpStore = {};

// -------------------- SEND OTP ---------------------------
export async function sendOTP(req, res) {
  console.log("🔥 /send-otp route hit");

  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const otp = generateOTP();
    const expireMs = 2 * 60 * 1000; // 2 minutes

    otpStore[email] = {
      otp,
      expiresAt: Date.now() + expireMs,
    };

    const { data, error } = await resend.emails.send({
      from: "Expense App <onboarding@resend.dev>",
      to: email,
      subject: "Your OTP Code",
      html: `
        <h2>Your OTP is: ${otp}</h2>
        <p>This code will expire in 2 minutes.</p>
      `,
    });

    if (error) {
      console.error("❌ Resend error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email",
      });
    }

    console.log("✅ OTP sent via Resend to:", email, data?.id);

    return res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (err) {
    console.error("❌ Send OTP Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Server error while sending OTP",
    });
  }
}

// -------------------- VERIFY OTP -------------------------
export function verifyOTP(req, res) {
  try {
    const { email, otp } = req.body;

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

    return res.json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (err) {
    console.error("❌ Verify OTP Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "OTP verification failed",
    });
  }
}
