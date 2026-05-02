import express from "express";
import {
  allOrders,
  placeOrder,
  updateStatus,
  userOrders,
  getOrderDetails,
} from "../controllers/orderController.js";
import adminAuth from "../middleware/adminAuth.js";
import authUser from "../middleware/auth.js";

const orderRouter = express.Router();

// ── User routes (require user auth) ──
orderRouter.post("/place", authUser, placeOrder);
orderRouter.get("/my", authUser, userOrders);

// ── Admin routes (require admin auth) ──
orderRouter.get("/admin/all", adminAuth, allOrders);
orderRouter.get("/admin/:id", adminAuth, getOrderDetails);
orderRouter.put("/admin/:id/status", adminAuth, updateStatus);

export default orderRouter;
