/**
 * Discount Service
 * Handles AI-driven discount negotiation for the chatbot.
 * Applies discounts by reducing prices from basePrice → minPrice.
 * Never modifies product DB prices — only cart item prices.
 */

import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";

/**
 * Apply discount to cart items.
 * @param {string} userId        – The authenticated user's ID
 * @param {string[]|null} productIds – Specific product IDs to discount, or null for ALL cart items
 * @returns {object} { success, data: { items, totalSavings, newCartTotal } }
 */
export const applyDiscountToCart = async (userId, productIds = null) => {
  const user = await userModel.findById(userId);
  if (!user) return { success: false, message: "User not found" };

  if (!user.cartData || user.cartData.length === 0) {
    return {
      success: false,
      message: "Your cart is empty. Add some items first before asking for a discount!",
    };
  }

  // ── Abuse prevention: only one discount per cart session ──
  if (user.hasDiscountApplied) {
    return {
      success: false,
      alreadyDiscounted: true,
      message: "I've already given you the best possible price 😊",
    };
  }

  // ── Determine which cart items to discount ──
  let targetItems;
  if (productIds && productIds.length > 0) {
    // Selective discount — match specific product IDs
    targetItems = user.cartData.filter((item) =>
      productIds.includes(item.productId.toString())
    );
    if (targetItems.length === 0) {
      return {
        success: false,
        message: "Those items are not currently in your cart.",
      };
    }
  } else {
    // Discount ALL cart items
    targetItems = [...user.cartData];
  }

  // ── Fetch product data for minPrice lookup ──
  const productIdsToFetch = [...new Set(targetItems.map((i) => i.productId.toString()))];
  const products = await productModel
    .find({ _id: { $in: productIdsToFetch } })
    .lean();

  const productMap = {};
  for (const p of products) {
    productMap[p._id.toString()] = p;
  }

  // ── Apply discounts ──
  const discountedItems = [];
  let totalSavings = 0;

  for (const item of user.cartData) {
    const pid = item.productId.toString();
    const isTarget = productIds
      ? productIds.includes(pid)
      : true; // discount all if no specific IDs

    if (!isTarget) continue;

    const product = productMap[pid];
    if (!product) continue;

    const currentPrice = item.originalPrice > 0 ? item.originalPrice : item.price;
    const minPrice = product.minPrice ?? product.basePrice ?? currentPrice;

    // Already at or below minPrice
    if (currentPrice <= minPrice) {
      discountedItems.push({
        productId: pid,
        name: item.name,
        oldPrice: currentPrice,
        newPrice: currentPrice,
        savings: 0,
        alreadyBest: true,
      });
      continue;
    }

    // Apply discount: basePrice → minPrice
    const savings = (currentPrice - minPrice) * item.quantity;
    totalSavings += savings;

    // Update cart item in-place
    item.originalPrice = currentPrice;
    item.discountedPrice = minPrice;
    item.price = minPrice;
    item.isDiscounted = true;

    discountedItems.push({
      productId: pid,
      name: item.name,
      oldPrice: currentPrice,
      newPrice: minPrice,
      savings: parseFloat(savings.toFixed(2)),
      alreadyBest: false,
    });
  }

  // If all targeted items were already at best price
  const actualDiscounts = discountedItems.filter((d) => !d.alreadyBest);
  if (actualDiscounts.length === 0) {
    return {
      success: false,
      message: "All those items are already at the best price I can offer! 🏷️",
    };
  }

  // ── Mark discount as applied & save ──
  user.hasDiscountApplied = true;
  user.markModified("cartData");
  await user.save();

  // ── Calculate new cart total ──
  const subtotal = user.cartData.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = subtotal > 0 ? 10 : 0;
  const newCartTotal = subtotal + deliveryFee;

  return {
    success: true,
    data: {
      items: discountedItems.filter((d) => !d.alreadyBest),
      allItems: discountedItems,
      totalSavings: parseFloat(totalSavings.toFixed(2)),
      newCartTotal: parseFloat(newCartTotal.toFixed(2)),
      subtotal: parseFloat(subtotal.toFixed(2)),
      deliveryFee,
    },
  };
};

/**
 * Find product IDs by name (fuzzy match against cart items).
 * Used by the controller when AI specifies product names instead of IDs.
 */
export const findCartProductByName = async (userId, productName) => {
  const user = await userModel.findById(userId);
  if (!user || !user.cartData || user.cartData.length === 0) return [];

  const searchName = productName.toLowerCase().trim();
  const matches = user.cartData.filter((item) =>
    (item.name || "").toLowerCase().includes(searchName)
  );

  return matches.map((m) => m.productId.toString());
};

/**
 * Reset discount flag when cart is cleared (e.g., after order).
 */
export const resetDiscountFlag = async (userId) => {
  await userModel.findByIdAndUpdate(userId, { hasDiscountApplied: false });
};
