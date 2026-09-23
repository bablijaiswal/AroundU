import express from "express";
import { askGemini } from "../services/geminiService.js";

const router = express.Router();

router.get("/test", async (req, res) => {
  try {
    const response = await askGemini("Say hello to AroundU in one sentence.");

    res.json({
      success: true,
      message: response,
    });
  } catch (error) {
    console.error("Gemini test error:", error);

    res.status(500).json({
      success: false,
      message: "Gemini API test failed",
    });
  }
});

router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body || {};

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const response = await askGemini(String(message).trim());

    return res.json({
      success: true,
      message: response,
    });
  } catch (error) {
    console.error("Gemini chat error:", error);

    return res.status(500).json({
      success: false,
      message: "Gemini assistant failed to respond",
    });
  }
});

export default router;