import express from "express";
import {
  addToCart,
  getUserCart,
  updateCart,
  removeFromCart,
  clearCart,
  mergeCart,
} from "../controllers/cartController.js";
import authUser from "../middleware/auth.js";

const cartRouter = express.Router();

cartRouter.post("/add", authUser, addToCart);
cartRouter.get("/", authUser, getUserCart);
cartRouter.put("/update", authUser, updateCart);
cartRouter.delete("/remove", authUser, removeFromCart);
cartRouter.delete("/clear", authUser, clearCart);
cartRouter.post("/merge", authUser, mergeCart);

export default cartRouter;
