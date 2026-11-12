import express from "express";
import { assistantChat } from "../controllers/assistantController.js";

const router = express.Router();

router.post("/chat", assistantChat);

export default router;