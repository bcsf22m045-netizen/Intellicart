import express from "express";
import {
  addProduct,
  updateProduct,
  listProduct,
  removeProduct,
  singleProduct,
} from "../controllers/productController.js";
import upload from "../middleware/multer.js";
import adminAuth from "../middleware/adminAuth.js";

const productRouter = express.Router();

// Dynamic image fields — support up to 20 images
const imageFields = Array.from({ length: 20 }, (_, i) => ({
  name: `image${i}`,
  maxCount: 1,
}));

productRouter.post(
  "/add",
  adminAuth,
  upload.fields(imageFields),
  addProduct
);

productRouter.put(
  "/update/:id",
  adminAuth,
  upload.fields(imageFields),
  updateProduct
);

productRouter.post("/single", singleProduct);
productRouter.get("/single/:id", singleProduct);
productRouter.post("/remove", adminAuth, removeProduct);
productRouter.get("/list", listProduct);

export default productRouter;
