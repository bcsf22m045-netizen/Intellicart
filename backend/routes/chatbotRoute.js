/**
 * Chatbot Routes
 * POST /api/chatbot/message  — Send a message to the AI chatbot
 * GET  /api/chatbot/greeting — Get personalized greeting
 */

import express from "express";
import { sendMessage, getGreeting } from "../controllers/chatbotController.js";

const chatbotRouter = express.Router();

chatbotRouter.post("/message", sendMessage);
chatbotRouter.get("/greeting", getGreeting);

export default chatbotRouter;
