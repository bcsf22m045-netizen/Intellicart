import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import upload from "../middleware/multer.js";
import {
  addCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
} from "../controllers/categoryController.js";

const categoryRouter = express.Router();

// ─── Category CRUD ───────────────────────────────────────────────────────────
categoryRouter.post("/add", adminAuth, upload.single("image"), addCategory);
categoryRouter.get("/list", getCategories);
categoryRouter.put("/update/:id", adminAuth, upload.single("image"), updateCategory);
categoryRouter.delete("/delete/:id", adminAuth, deleteCategory);

// ─── Subcategory CRUD ────────────────────────────────────────────────────────
categoryRouter.post("/:id/subcategory/add", adminAuth, upload.single("image"), addSubcategory);
categoryRouter.put("/:id/subcategory/:subId", adminAuth, upload.single("image"), updateSubcategory);
categoryRouter.delete("/:id/subcategory/:subId", adminAuth, deleteSubcategory);

export default categoryRouter;
