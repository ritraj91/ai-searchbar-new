import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

import aiRouter from "./routes/aiRouter.js";
import assistantRouter from "./routes/assistantRouter.js";
import documentRouter from "./routes/documentRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5180",
      "http://127.0.0.1:5180",
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json({ limit: "1mb" }));

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

const assistantLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

const documentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

app.use("/api/ai", aiLimiter, aiRouter);
app.use("/api/assistant", assistantLimiter, assistantRouter);
app.use("/api/documents", documentLimiter, documentRouter);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "HourMaker AI Backend is running!",
    endpoints: {
      aiSearch: "/api/ai/search",
      assistant: "/api/assistant/chat",
      documentUpload: "POST /api/documents/upload",
      documentList: "GET /api/documents",
    },
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found.",
  });
});

app.use((error, req, res, next) => {
  console.error("Backend error:", error.message);

  if (res.headersSent) return next(error);

  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Something went wrong on the server.",
  });
});

const server = app.listen(PORT, () => {
  console.log("----------------------------------");
  console.log(`HourMaker backend: http://localhost:${PORT}`);
  console.log(`AI Search: http://localhost:${PORT}/api/ai/search`);
  console.log(`AI Assistant: http://localhost:${PORT}/api/assistant/chat`);
  console.log(`Documents: http://localhost:${PORT}/api/documents`);
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
