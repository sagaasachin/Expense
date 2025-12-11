import express from "express";
import cors from "cors";

import { connectDB } from "./db.js";
import otpRoutes from "./routes/otpRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";

const app = express();

// CORS for Render frontend
app.use(
  cors({
    origin: "*",
    methods: "GET,POST,PUT,DELETE",
  })
);

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

// PORT FIX FOR RENDER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
