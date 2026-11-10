import express from "express";
import multer from "multer";
import {
  uploadDocument,
  listDocuments,
  getDocument,
  deleteDocument,
} from "../controllers/documentController.js";

const router = express.Router();

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    const extension = file.originalname.split(".").pop()?.toLowerCase();
    const validExtension = ["pdf", "docx", "txt"].includes(extension);

    if (!validExtension || !allowedMimeTypes.has(file.mimetype)) {
      const error = new Error("Only PDF, DOCX, and TXT files are supported.");
      error.status = 415;
      return callback(error);
    }

    callback(null, true);
  },
});

router.post("/upload", (req, res, next) => {
  upload.single("document")(req, res, (error) => {
    if (error) {
      error.status = error.status || (error.code === "LIMIT_FILE_SIZE" ? 413 : 400);
      error.message =
        error.code === "LIMIT_FILE_SIZE"
          ? "File is too large. Maximum size is 10 MB."
          : error.message;
      return next(error);
    }
    next();
  });
}, uploadDocument);

router.get("/", listDocuments);
router.get("/:id", getDocument);
router.delete("/:id", deleteDocument);

export default router;
