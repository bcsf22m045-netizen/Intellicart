import mongoose from "mongoose";

/* ── Order Item sub-schema ─────────────────────────────────────────────── */
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
      required: true,
    },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    size: { type: String, default: "" },
    color: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, default: null },
    discountApplied: { type: Boolean, default: false },
  },
  { _id: false }
);

/* ── Shipping Address sub-schema ───────────────────────────────────────── */
const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
  },
  { _id: false }
);

/* ── Order Schema ──────────────────────────────────────────────────────── */
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [(v) => v.length > 0, "Order must have at least one item"],
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    paymentMethod: {
      type: String,
      default: "Cash on Delivery",
      enum: ["Cash on Delivery"],
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    originalTotal: {
      type: Number,
      default: null,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    orderStatus: {
      type: String,
      required: true,
      default: "Pending",
      enum: ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"],
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

/* ── Indexes ─────────────────────────────────────────────────────────── */
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });

const orderModel =
  mongoose.models.order || mongoose.model("order", orderSchema);
export default orderModel;
