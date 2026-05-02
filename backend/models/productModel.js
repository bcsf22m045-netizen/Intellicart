import mongoose from "mongoose";

/* ── Stock entry: one per size×color combination ─────────────────────────── */
const stockEntrySchema = new mongoose.Schema(
  {
    size: { type: String, default: "" },
    color: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
);

/* ── Color-mapped image ──────────────────────────────────────────────────── */
const colorImageSchema = new mongoose.Schema(
  {
    color: { type: String, default: "" },
    url: { type: String, required: true },
  },
  { _id: false }
);

/* ── Variant pricing override ────────────────────────────────────────────── */
const variantPriceSchema = new mongoose.Schema(
  {
    size: { type: String, default: "" },
    color: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    sku: { type: String, default: "" },
  },
  { _id: false }
);

/* ── Product Schema ──────────────────────────────────────────────────────── */
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },

    // Category references (ObjectId) — we also store name for quick reads
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      required: true,
    },
    categoryName: { type: String, default: "" },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      default: null,
    },
    subCategoryName: { type: String, default: "" },

    // Images — each mapped to a color (empty string = general / no-color)
    images: [colorImageSchema],
    // Legacy field kept as virtual for backward compat
    // (old frontend reads `product.image` as flat URL array)

    // Sizes & Colors — optional
    sizes: [{ type: String, trim: true }],
    colors: [
      {
        name: { type: String, required: true, trim: true },
        hex: { type: String, default: "#000000", trim: true },
      },
    ],

    // Stock per size×color
    stock: [stockEntrySchema],

    // Pricing
    basePrice: { type: Number, required: true, min: 0 },
    minPrice: { type: Number, required: true, min: 0 },

    // Per-variant price & SKU overrides
    variants: [variantPriceSchema],

    // Master SKU
    sku: { type: String, required: true, unique: true, trim: true },

    bestSeller: { type: Boolean, default: false },
    date: { type: Number, default: Date.now },

    // Review aggregates (updated by review controller)
    numReviews: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ── Virtuals for backward compatibility ─────────────────────────────────── */

// `image` returns flat array of URLs (old frontend needs this)
productSchema.virtual("image").get(function () {
  return (this.images || []).map((img) => img.url);
});

// `price` returns basePrice (old frontend reads `product.price`)
productSchema.virtual("price").get(function () {
  return this.basePrice;
});

/* ── Indexes ─────────────────────────────────────────────────────────────── */
productSchema.index({ sku: 1 }, { unique: true });
productSchema.index({ category: 1, subCategory: 1 });
productSchema.index({ name: "text" });

const productModel =
  mongoose.models.product || mongoose.model("product", productSchema);
export default productModel;
