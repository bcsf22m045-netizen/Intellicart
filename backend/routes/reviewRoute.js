import express from "express";
import authUser from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  getAllReviews,
  adminDeleteReview,
} from "../controllers/reviewController.js";

const reviewRouter = express.Router();

/* ── Public ───────────────────────────────────────────────────────────── */
reviewRouter.get("/product/:productId", getProductReviews);

/* ── User (auth required) ─────────────────────────────────────────────── */
reviewRouter.post("/:productId", authUser, createReview);
reviewRouter.put("/:reviewId", authUser, updateReview);
reviewRouter.delete("/:reviewId", authUser, deleteReview);

/* ── Admin ─────────────────────────────────────────────────────────────── */
reviewRouter.get("/admin/all", adminAuth, getAllReviews);
reviewRouter.delete("/admin/:id", adminAuth, adminDeleteReview);

export default reviewRouter;
