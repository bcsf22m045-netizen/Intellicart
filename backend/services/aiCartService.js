/**
 * AI Cart Service
 * Internal service for chatbot to manage cart operations.
 * Separated from chatbot logic for clean architecture.
 */

import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";

/**
 * Get available stock for a size+color combo (case-insensitive)
 */
const getAvailableStock = (product, size, color) => {
  if (!product.stock || product.stock.length === 0) return Infinity;
  const entry = product.stock.find(
    (s) =>
      (s.size || "").toLowerCase() === (size || "").toLowerCase() &&
      (s.color || "").toLowerCase() === (color || "").toLowerCase()
  );
  return entry ? entry.quantity : 0;
};

/**
 * Get product variant details (sizes, colors, stock, pricing)
 */
export const getProductVariants = async (productId) => {
  const product = await productModel.findById(productId).lean();
  if (!product) return { success: false, message: "Product not found" };

  const stockInfo = (product.stock || []).map((s) => ({
    size: s.size || "",
    color: s.color || "",
    quantity: s.quantity,
    status:
      s.quantity === 0
        ? "Out of stock"
        : s.quantity <= 3
        ? "Low stock"
        : "In stock",
  }));

  // Get image for each color
  const colorImages = {};
  for (const img of product.images || []) {
    if (img.color) colorImages[img.color] = img.url;
  }

  return {
    success: true,
    data: {
      type: "product_variant_info",
      productId: product._id.toString(),
      name: product.name,
      description: product.description,
      basePrice: product.basePrice,
      minPrice: product.minPrice,
      image: product.images?.[0]?.url || "",
      availableSizes: product.sizes || [],
      availableColors: (product.colors || []).map((c) => ({
        name: c.name,
        hex: c.hex,
        image: colorImages[c.name] || "",
      })),
      stockInfo,
      variants: (product.variants || []).map((v) => ({
        size: v.size,
        color: v.color,
        price: v.price,
      })),
      url: `/product/${product._id}`,
    },
  };
};

/**
 * Add an item to the user's cart
 * @returns {{ success, message, item? }}
 */
export const addItemToCart = async (
  userId,
  productId,
  size = "",
  color = "",
  quantity = 1
) => {
  // Validate product
  const product = await productModel.findById(productId);
  if (!product) return { success: false, message: "Product not found." };

  // Validate size if product has sizes
  if (product.sizes && product.sizes.length > 0 && !size) {
    return {
      success: false,
      message: "SIZE_REQUIRED",
      availableSizes: product.sizes,
    };
  }
  if (size && product.sizes?.length > 0) {
    const matchedSize = product.sizes.find(
      (s) => s.toLowerCase() === size.toLowerCase()
    );
    if (!matchedSize) {
      return {
        success: false,
        message: `Size "${size}" is not available. Available sizes: ${product.sizes.join(", ")}`,
        availableSizes: product.sizes,
      };
    }
    size = matchedSize; // normalize case
  }

  // Validate color if product has colors
  const colorNames = (product.colors || []).map((c) => c.name);
  if (colorNames.length > 0 && !color) {
    return {
      success: false,
      message: "COLOR_REQUIRED",
      availableColors: product.colors,
    };
  }
  if (color && colorNames.length > 0) {
    const matchedColor = colorNames.find(
      (c) => c.toLowerCase() === color.toLowerCase()
    );
    if (!matchedColor) {
      return {
        success: false,
        message: `Color "${color}" is not available. Available colors: ${colorNames.join(", ")}`,
        availableColors: product.colors,
      };
    }
    color = matchedColor; // normalize case
  }

  // Check stock
  const available = getAvailableStock(product, size, color);
  if (available !== Infinity && available < quantity) {
    return {
      success: false,
      message:
        available === 0
          ? `Sorry, ${product.name} (${[size, color].filter(Boolean).join(", ")}) is out of stock.`
          : `Only ${available} left in stock for ${product.name} (${[size, color].filter(Boolean).join(", ")}).`,
    };
  }

  // Build cart item
  let image = "";
  if (product.images?.length > 0) {
    const colorImg = color
      ? product.images.find((img) => img.color === color)
      : null;
    image = colorImg ? colorImg.url : product.images[0].url;
  }

  let price = product.basePrice;
  if (product.variants?.length > 0) {
    const variant = product.variants.find(
      (v) =>
        (!v.size || v.size === size) && (!v.color || v.color === color)
    );
    if (variant?.price) price = variant.price;
  }

  // Update user cart in DB
  const user = await userModel.findById(userId);
  if (!user) return { success: false, message: "User not found." };

  // Check if item already in cart (case-insensitive)
  const existingIdx = user.cartData.findIndex(
    (item) =>
      item.productId.toString() === productId &&
      (item.size || "").toLowerCase() === (size || "").toLowerCase() &&
      (item.color || "").toLowerCase() === (color || "").toLowerCase()
  );

  if (existingIdx >= 0) {
    user.cartData[existingIdx].quantity += quantity;
  } else {
    user.cartData.push({
      productId: product._id,
      name: product.name,
      image,
      price,
      originalPrice: price,
      discountedPrice: null,
      isDiscounted: false,
      size,
      color,
      quantity,
    });
  }

  await user.save();

  return {
    success: true,
    message: `✅ Added ${quantity}x ${product.name}${size ? ` (Size ${size})` : ""}${color ? ` in ${color}` : ""} to your cart.`,
    item: {
      productId: product._id.toString(),
      name: product.name,
      image,
      price,
      size,
      color,
      quantity,
    },
  };
};

/**
 * Get cart summary for a user
 */
export const getCartSummary = async (userId) => {
  const user = await userModel.findById(userId).lean();
  if (!user) return { success: false, message: "User not found." };

  const cartItems = user.cartData || [];
  if (cartItems.length === 0) {
    return { success: false, message: "Your cart is empty." };
  }

  let subtotal = 0;
  let originalSubtotal = 0;
  const items = cartItems.map((item) => {
    const lineTotal = (item.price || 0) * (item.quantity || 1);
    const originalLineTotal = (item.originalPrice || item.price || 0) * (item.quantity || 1);
    subtotal += lineTotal;
    originalSubtotal += originalLineTotal;
    return {
      productId: item.productId.toString(),
      name: item.name || "Product",
      image: item.image || "",
      price: item.price || 0,
      originalPrice: item.originalPrice || item.price || 0,
      discountedPrice: item.discountedPrice || null,
      isDiscounted: item.isDiscounted || false,
      size: item.size || "",
      color: item.color || "",
      quantity: item.quantity || 1,
      lineTotal,
    };
  });

  const deliveryFee = 10;
  const total = subtotal + deliveryFee;
  const discountAmount = originalSubtotal - subtotal;

  return {
    success: true,
    data: {
      type: "cart_summary",
      items,
      subtotal,
      originalSubtotal: discountAmount > 0 ? originalSubtotal : null,
      discountAmount: discountAmount > 0 ? parseFloat(discountAmount.toFixed(2)) : 0,
      deliveryFee,
      total,
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    },
  };
};

/**
 * Remove a specific item from the user's cart by product name (+ optional size/color)
 * If productName is "ALL", clears the entire cart.
 * @returns {{ success, message, removedItem? }}
 */
export const removeItemFromCart = async (userId, productName, size = "", color = "") => {
  const user = await userModel.findById(userId);
  if (!user) return { success: false, message: "User not found." };

  const cartItems = user.cartData || [];
  if (cartItems.length === 0) {
    return { success: false, message: "Your cart is already empty! 🛒" };
  }

  // ── Clear entire cart ──
  if (productName === "ALL") {
    const count = cartItems.length;
    user.cartData = [];
    await user.save();
    return {
      success: true,
      message: `🗑️ Cleared all ${count} item${count > 1 ? "s" : ""} from your cart.`,
    };
  }

  // ── Find matching item by name (case-insensitive fuzzy) ──
  const nameLower = productName.toLowerCase().trim();

  const matchIndex = cartItems.findIndex((item) => {
    const itemName = (item.name || "").toLowerCase();
    const nameMatch = itemName === nameLower || itemName.includes(nameLower) || nameLower.includes(itemName);
    if (!nameMatch) return false;

    // If size/color specified, also match those
    if (size && (item.size || "").toLowerCase() !== size.toLowerCase()) return false;
    if (color && (item.color || "").toLowerCase() !== color.toLowerCase()) return false;
    return true;
  });

  if (matchIndex === -1) {
    return {
      success: false,
      message: `Couldn't find "${productName}"${size ? ` (Size ${size})` : ""}${color ? ` in ${color}` : ""} in your cart.`,
    };
  }

  const removed = cartItems[matchIndex];
  user.cartData.splice(matchIndex, 1);
  await user.save();

  return {
    success: true,
    message: `🗑️ Removed ${removed.name}${removed.size ? ` (Size ${removed.size})` : ""}${removed.color ? ` in ${removed.color}` : ""} from your cart.`,
    removedItem: {
      name: removed.name,
      size: removed.size || "",
      color: removed.color || "",
      quantity: removed.quantity,
      price: removed.price,
    },
  };
};
