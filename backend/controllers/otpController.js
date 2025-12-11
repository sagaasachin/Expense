import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

let otpStore = {};

// -------------------- EMAIL WHITELIST --------------------
// FIX: Prevent crash if variable is missing
const allowedEmails = (process.env.ALLOWED_EMAILS || "").split(",");

// -------------------- MAIL SETUP -------------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// -------------------- OTP GENERATOR ----------------------
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// -------------------- SEND OTP ---------------------------
export async function sendOTP(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.json({ success: false, message: "Email required" });
  }

  // If whitelist missing → allow all emails
  if (
    allowedEmails.length > 0 &&
    allowedEmails[0] !== "" &&
    !allowedEmails.includes(email)
  ) {
    return res.status(403).json({
      success: false,
      message: "This email is not allowed to access the system",
    });
  }

  const otp = generateOTP();
  otpStore[email] = otp;

  const expireTime = parseInt(process.env.OTP_EXPIRE_MS) || 120000;
  setTimeout(() => delete otpStore[email], expireTime);

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It expires in 2 minutes.`,
    });

    res.json({ success: true, message: "OTP sent" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// -------------------- VERIFY OTP ---------------------------
export function verifyOTP(req, res) {
  const { email, otp } = req.body;

  if (otpStore[email] === otp) {
    delete otpStore[email];
    return res.json({ success: true });
  }

  res.json({ success: false, message: "Invalid OTP" });
}
