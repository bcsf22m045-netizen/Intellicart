/**
 * AI Checkout Service
 * Internal service for chatbot-driven checkout and order placement.
 * Separated from chatbot logic for clean architecture.
 */

import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";

const DELIVERY_FEE = 10;

/**
 * Deduct stock for a single item
 */
const deductStock = async (productId, size, color, quantity) => {
  const product = await productModel.findById(productId);
  if (!product) return { ok: false, message: `Product not found` };
  if (!product.stock || product.stock.length === 0) return { ok: true };

  const stockIdx = product.stock.findIndex(
    (s) =>
      (s.size || "") === (size || "") && (s.color || "") === (color || "")
  );

  if (stockIdx < 0) return { ok: true }; // No stock tracking for this combo

  if (product.stock[stockIdx].quantity < quantity) {
    return {
      ok: false,
      message: `Insufficient stock for ${product.name} (${size || "N/A"}/${color || "N/A"}). Available: ${product.stock[stockIdx].quantity}`,
    };
  }

  product.stock[stockIdx].quantity -= quantity;
  await product.save();
  return { ok: true };
};

/**
 * Validate shipping address fields
 */
export const validateShippingAddress = (address) => {
  const required = ["fullName", "phone", "address", "city", "postalCode"];
  const missing = required.filter((f) => !address[f] || !address[f].trim());

  if (missing.length > 0) {
    return {
      valid: false,
      missing,
      message: `Please provide: ${missing.join(", ")}`,
    };
  }
  return { valid: true };
};

/**
 * Parse shipping address from user text
 * Expected format: "Name, Phone, Address, City, PostalCode"
 */
export const parseShippingAddress = (text) => {
  // Try comma-separated format
  const parts = text.split(",").map((s) => s.trim());

  // Format: Full Name, Email, Phone, Address, City, Postal Code (6 fields)
  if (parts.length >= 6) {
    return {
      success: true,
      address: {
        fullName: parts[0],
        email: parts[1],
        phone: parts[2],
        address: parts[3],
        city: parts[4],
        postalCode: parts[5],
      },
    };
  }

  // Legacy fallback: Full Name, Phone, Address, City, Postal Code (5 fields, no email)
  if (parts.length >= 5) {
    return {
      success: true,
      address: {
        fullName: parts[0],
        phone: parts[1],
        address: parts[2],
        city: parts[3],
        postalCode: parts[4],
        email: "",
      },
    };
  }

  return {
    success: false,
    message:
      "Please provide your shipping details in this format:\n**Full Name, Email, Phone, Address, City, Postal Code**",
  };
};

/**
 * Place an order from the user's cart
 * @returns {{ success, message, order? }}
 */
export const placeOrderFromCart = async (userId, shippingAddress) => {
  // Get user and cart
  const user = await userModel.findById(userId);
  if (!user) return { success: false, message: "User not found." };

  const cartItems = user.cartData || [];
  if (cartItems.length === 0) {
    return { success: false, message: "Your cart is empty. Add items first!" };
  }

  // Add email from user if not provided
  if (!shippingAddress.email) {
    shippingAddress.email = user.email || "noreply@intellicart.com";
  }

  // Validate all items and check stock
  const orderItems = [];
  let subtotal = 0;
  let originalSubtotal = 0;

  for (const item of cartItems) {
    const product = await productModel.findById(item.productId);
    if (!product) {
      return {
        success: false,
        message: `Product "${item.name}" is no longer available.`,
      };
    }

    // Use cart item price (includes discount if applied) instead of re-fetching basePrice
    const itemPrice = item.price ?? product.basePrice ?? 0;
    const originalPrice = item.originalPrice || item.price || itemPrice;
    const isDiscounted = item.isDiscounted || false;

    // Check stock
    if (product.stock?.length > 0) {
      const stockEntry = product.stock.find(
        (s) =>
          (s.size || "") === (item.size || "") &&
          (s.color || "") === (item.color || "")
      );
      if (!stockEntry || stockEntry.quantity < item.quantity) {
        const avail = stockEntry ? stockEntry.quantity : 0;
        return {
          success: false,
          message: `Insufficient stock for ${product.name} (${item.size || "N/A"}/${item.color || "N/A"}). Available: ${avail}`,
        };
      }
    }

    let image = "";
    if (product.images?.length > 0) {
      const colorImg = item.color
        ? product.images.find((img) => img.color === item.color)
        : null;
      image = colorImg ? colorImg.url : product.images[0].url;
    }

    const lineTotal = itemPrice * item.quantity;
    const originalLineTotal = originalPrice * item.quantity;
    subtotal += lineTotal;
    originalSubtotal += originalLineTotal;

    orderItems.push({
      product: product._id,
      name: product.name,
      image,
      size: item.size || "",
      color: item.color || "",
      quantity: item.quantity,
      price: itemPrice,
      originalPrice: isDiscounted ? originalPrice : null,
      discountApplied: isDiscounted,
    });
  }

  const totalPrice = subtotal + DELIVERY_FEE;
  const discountAmount = originalSubtotal - subtotal;

  // Deduct stock
  for (const item of orderItems) {
    const result = await deductStock(
      item.product,
      item.size,
      item.color,
      item.quantity
    );
    if (!result.ok) {
      return { success: false, message: result.message };
    }
  }

  // Create order
  const newOrder = new orderModel({
    user: userId,
    items: orderItems,
    shippingAddress,
    paymentMethod: "Cash on Delivery",
    totalPrice,
    originalTotal: discountAmount > 0 ? originalSubtotal + DELIVERY_FEE : null,
    discountAmount: discountAmount > 0 ? parseFloat(discountAmount.toFixed(2)) : 0,
    orderStatus: "Pending",
    isPaid: false,
  });

  await newOrder.save();

  // Clear user cart
  user.cartData = [];
  await user.save();

  return {
    success: true,
    message: "🎉 Order placed successfully!",
    order: {
      orderId: newOrder._id.toString(),
      totalPrice,
      subtotal,
      deliveryFee: DELIVERY_FEE,
      itemCount: orderItems.length,
      items: orderItems.map((i) => ({
        name: i.name,
        size: i.size,
        color: i.color,
        quantity: i.quantity,
        price: i.price,
        image: i.image,
      })),
      status: "Pending",
      paymentMethod: "Cash on Delivery",
    },
  };
};
