import express from "express";
import cors from "cors";

import { connectDB } from "./db.js";
import otpRoutes from "./routes/otpRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/otp", otpRoutes);
app.use("/api/transactions", transactionRoutes);

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "Server running" });
});

// Start Server
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
