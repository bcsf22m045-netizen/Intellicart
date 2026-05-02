import mongoose from "mongoose";

/**
 * Subcategory sub-schema
 * Embedded inside each Category document
 */
const subcategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

/**
 * Category Schema
 * Stores product categories with nested subcategories
 */
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    image: {
      type: String,
      default: null,
    },
    subcategories: [subcategorySchema],
  },
  { timestamps: true }
);

// Index for fast lookups
categorySchema.index({ name: 1 });

const categoryModel =
  mongoose.models.category || mongoose.model("category", categorySchema);

export default categoryModel;
