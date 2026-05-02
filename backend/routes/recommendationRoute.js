import express from "express";
import {
  getRecommendations,
  getModelStatus,
  reloadModel,
} from "../controllers/recommendationController.js";
import adminAuth from "../middleware/adminAuth.js";

const recommendationRouter = express.Router();

// Public: Check if ML model is loaded (must be before /:id to avoid matching "model" as an ID)
recommendationRouter.get("/model/status", getModelStatus);

// Admin-only: Hot-reload the ML model
recommendationRouter.post("/model/reload", adminAuth, reloadModel);

// Public: Get ML-powered recommendations for a product
recommendationRouter.get("/:id", getRecommendations);

export default recommendationRouter;
