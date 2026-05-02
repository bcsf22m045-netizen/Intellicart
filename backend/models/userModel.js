import mongoose from "mongoose";

/**
 * User Schema for MongoDB
 * Includes fields for email verification and OAuth providers
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function() {
        // Password is required only for local auth (not OAuth)
        return !this.googleId;
      },
    },
    // Email verification fields
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      default: null,
    },
    verificationTokenExpires: {
      type: Date,
      default: null,
    },
    // Refresh token for JWT rotation
    refreshToken: {
      type: String,
      default: null,
    },
    // Google OAuth fields
    googleId: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    // Auth provider tracking
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    // Password reset fields
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    // Shopping cart data — array of cart items
    cartData: {
      type: [
        {
          productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "product",
            required: true,
          },
          name: { type: String, default: "" },
          image: { type: String, default: "" },
          price: { type: Number, default: 0 },
          originalPrice: { type: Number, default: 0 },
          discountedPrice: { type: Number, default: null },
          isDiscounted: { type: Boolean, default: false },
          size: { type: String, default: "" },
          color: { type: String, default: "" },
          quantity: { type: Number, default: 1, min: 1 },
        },
      ],
      default: [],
    },
    // Flag to prevent multiple discounts per cart session
    hasDiscountApplied: {
      type: Boolean,
      default: false,
    },
  },
  { 
    minimize: false,
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ verificationToken: 1 });
userSchema.index({ googleId: 1 });

const userModel = mongoose.models.user || mongoose.model("user", userSchema);
export default userModel;
