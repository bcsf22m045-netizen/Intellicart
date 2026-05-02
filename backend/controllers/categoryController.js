import categoryModel from "../models/categoryModel.js";
import { v2 as cloudinary } from "cloudinary";

// ─── CATEGORIES ──────────────────────────────────────────────────────────────

/**
 * Add a new category
 * POST /api/category/add
 */
const addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Category name is required" });
    }

    // Check duplicate
    const existing = await categoryModel.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Category already exists" });
    }

    let imageUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "image",
        folder: "categories",
      });
      imageUrl = result.secure_url;
    }

    const category = new categoryModel({
      name: name.trim(),
      description: description?.trim() || "",
      image: imageUrl,
    });

    await category.save();

    res.json({ success: true, message: "Category added", category });
  } catch (error) {
    console.error("addCategory error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all categories (with subcategories)
 * GET /api/category/list
 */
const getCategories = async (req, res) => {
  try {
    const categories = await categoryModel.find({}).sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    console.error("getCategories error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update a category
 * PUT /api/category/update/:id
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await categoryModel.findById(id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    // Check duplicate (exclude self)
    if (name && name.trim()) {
      const existing = await categoryModel.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      });
      if (existing) {
        return res
          .status(409)
          .json({ success: false, message: "Category name already exists" });
      }
      category.name = name.trim();
    }

    if (description !== undefined) {
      category.description = description.trim();
    }

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "image",
        folder: "categories",
      });
      category.image = result.secure_url;
    }

    await category.save();

    res.json({ success: true, message: "Category updated", category });
  } catch (error) {
    console.error("updateCategory error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a category
 * DELETE /api/category/delete/:id
 */
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await categoryModel.findByIdAndDelete(id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    res.json({ success: true, message: "Category deleted" });
  } catch (error) {
    console.error("deleteCategory error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── SUBCATEGORIES ───────────────────────────────────────────────────────────

/**
 * Add a subcategory to a category
 * POST /api/category/:id/subcategory/add
 */
const addSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Subcategory name is required" });
    }

    const category = await categoryModel.findById(id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    // Check duplicate subcategory within this category
    const duplicate = category.subcategories.find(
      (sc) => sc.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (duplicate) {
      return res
        .status(409)
        .json({ success: false, message: "Subcategory already exists in this category" });
    }

    let imageUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "image",
        folder: "categories/subcategories",
      });
      imageUrl = result.secure_url;
    }

    category.subcategories.push({ name: name.trim(), image: imageUrl });
    await category.save();

    res.json({ success: true, message: "Subcategory added", category });
  } catch (error) {
    console.error("addSubcategory error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update a subcategory
 * PUT /api/category/:id/subcategory/:subId
 */
const updateSubcategory = async (req, res) => {
  try {
    const { id, subId } = req.params;
    const { name } = req.body;

    const category = await categoryModel.findById(id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    const subcategory = category.subcategories.id(subId);
    if (!subcategory) {
      return res
        .status(404)
        .json({ success: false, message: "Subcategory not found" });
    }

    if (name && name.trim()) {
      // Check duplicate (exclude self)
      const duplicate = category.subcategories.find(
        (sc) =>
          sc._id.toString() !== subId &&
          sc.name.toLowerCase() === name.trim().toLowerCase()
      );
      if (duplicate) {
        return res
          .status(409)
          .json({ success: false, message: "Subcategory name already exists in this category" });
      }
      subcategory.name = name.trim();
    }

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "image",
        folder: "categories/subcategories",
      });
      subcategory.image = result.secure_url;
    }

    await category.save();

    res.json({ success: true, message: "Subcategory updated", category });
  } catch (error) {
    console.error("updateSubcategory error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a subcategory
 * DELETE /api/category/:id/subcategory/:subId
 */
const deleteSubcategory = async (req, res) => {
  try {
    const { id, subId } = req.params;

    const category = await categoryModel.findById(id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    const subcategory = category.subcategories.id(subId);
    if (!subcategory) {
      return res
        .status(404)
        .json({ success: false, message: "Subcategory not found" });
    }

    category.subcategories.pull(subId);
    await category.save();

    res.json({ success: true, message: "Subcategory deleted", category });
  } catch (error) {
    console.error("deleteSubcategory error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  addCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
};
