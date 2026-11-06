
import dotenv from "dotenv";
import "dotenv/config";

// Load environment variables
dotenv.config();

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

import aiRouter from "./routes/aiRouter.js";
import assistantRouter from "./routes/assistantRouter.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Check Gemini API key
console.log(
  "Gemini API key available:",
  Boolean(process.env.NVIDIA_API_KEY)
);

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5180",
      "http://127.0.0.1:5180"
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
  })
);
app.use(express.json({ limit: "1mb" }));

// Rate limiter for existing AI search
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

// Rate limiter for Advanced AI Assistant
const assistantLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

// Existing AI Search API
app.use("/api/ai", aiLimiter, aiRouter);

// New Advanced AI Assistant API
app.use("/api/assistant", assistantLimiter, assistantRouter);

// Backend health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "HourMaker AI Backend is running!",
    endpoints: {
      aiSearch: "/api/ai/search",
      assistant: "/api/assistant/chat",
    },
  });
});

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found.",
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Backend error:", error.message);

  res.status(error.status || 500).json({
    success: false,
    message: "Something went wrong on the server.",
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log("----------------------------------");
  console.log(`HourMaker backend: http://localhost:${PORT}`);
  console.log(`AI Search: http://localhost:${PORT}/api/ai/search`);
  console.log(`AI Assistant: http://localhost:${PORT}/api/assistant/chat`);
  console.log("----------------------------------");
});

server.on("error", (error) => {
  console.error("Server error:", error);
});

process.on("SIGINT", () => {
  console.log("\nShutting down HourMaker backend...");
  server.close(() => {
    console.log("Backend stopped.");
    process.exit(0);
  });
});
