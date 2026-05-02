import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";

/* ── Helper: build a product snapshot for the cart item ─────────────── */
const buildCartItem = (product, size, color, quantity) => {
  // Find the best image for this color
  let image = "";
  if (product.images && product.images.length > 0) {
    const colorImg = color
      ? product.images.find((img) => img.color === color)
      : null;
    image = colorImg ? colorImg.url : product.images[0].url;
  }

  // Find variant-specific price or fall back to base price
  let price = product.basePrice ?? product.price ?? 0;
  if (product.variants && product.variants.length > 0) {
    const variant = product.variants.find(
      (v) => (!v.size || v.size === size) && (!v.color || v.color === color)
    );
    if (variant && variant.price) price = variant.price;
  }

  return {
    productId: product._id,
    name: product.name,
    image,
    price,
    size: size || "",
    color: color || "",
    quantity: quantity || 1,
  };
};

/* ── Helper: get available stock for a size+color combo ──────────────── */
const getAvailableStock = (product, size, color) => {
  if (!product.stock || product.stock.length === 0) return Infinity; // no stock tracking
  const entry = product.stock.find(
    (s) =>
      (s.size || "") === (size || "") && (s.color || "") === (color || "")
  );
  return entry ? entry.quantity : 0;
};

/* ────────────────────────────────────────────────────────────────────── */
/*  POST /api/cart/add                                                   */
/* ────────────────────────────────────────────────────────────────────── */
export const addToCart = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { productId, size, color, quantity } = req.body;

    if (!productId) {
      return res.json({ success: false, message: "Product ID is required" });
    }

    const product = await productModel.findById(productId);
    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    const qty = quantity || 1;

    // Check stock
    const available = getAvailableStock(product, size, color);
    if (available !== Infinity && available < qty) {
      return res.json({
        success: false,
        message: `Only ${available} item(s) in stock`,
      });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Check if same product+size+color already in cart
    const existingIdx = user.cartData.findIndex(
      (item) =>
        item.productId.toString() === productId &&
        (item.size || "") === (size || "") &&
        (item.color || "") === (color || "")
    );

    if (existingIdx >= 0) {
      const newQty = user.cartData[existingIdx].quantity + qty;
      if (available !== Infinity && newQty > available) {
        return res.json({
          success: false,
          message: `Only ${available} item(s) in stock. You already have ${user.cartData[existingIdx].quantity} in cart.`,
        });
      }
      user.cartData[existingIdx].quantity = newQty;
    } else {
      user.cartData.push(buildCartItem(product, size, color, qty));
    }

    await user.save();

    res.json({ success: true, message: "Added to cart", cartData: user.cartData });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

/* ────────────────────────────────────────────────────────────────────── */
/*  GET /api/cart                                                        */
/* ────────────────────────────────────────────────────────────────────── */
export const getUserCart = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Refresh stock info for each cart item
    const enrichedCart = [];
    for (const item of user.cartData) {
      const product = await productModel.findById(item.productId);
      const stockAvailable = product
        ? getAvailableStock(product, item.size, item.color)
        : 0;
      enrichedCart.push({
        ...item.toObject(),
        stockAvailable: stockAvailable === Infinity ? 9999 : stockAvailable,
      });
    }

    res.json({ success: true, cartData: enrichedCart });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

/* ────────────────────────────────────────────────────────────────────── */
/*  PUT /api/cart/update                                                 */
/* ────────────────────────────────────────────────────────────────────── */
export const updateCart = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { productId, size, color, quantity } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const idx = user.cartData.findIndex(
      (item) =>
        item.productId.toString() === productId &&
        (item.size || "") === (size || "") &&
        (item.color || "") === (color || "")
    );

    if (idx < 0) {
      return res.json({ success: false, message: "Item not found in cart" });
    }

    if (quantity <= 0) {
      // Remove the item
      user.cartData.splice(idx, 1);
    } else {
      // Check stock
      const product = await productModel.findById(productId);
      if (product) {
        const available = getAvailableStock(product, size, color);
        if (available !== Infinity && quantity > available) {
          return res.json({
            success: false,
            message: `Only ${available} item(s) in stock`,
          });
        }
      }
      user.cartData[idx].quantity = quantity;
    }

    await user.save();
    res.json({ success: true, message: "Cart updated", cartData: user.cartData });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

/* ────────────────────────────────────────────────────────────────────── */
/*  DELETE /api/cart/remove                                              */
/* ────────────────────────────────────────────────────────────────────── */
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { productId, size, color } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    user.cartData = user.cartData.filter(
      (item) =>
        !(
          item.productId.toString() === productId &&
          (item.size || "") === (size || "") &&
          (item.color || "") === (color || "")
        )
    );

    await user.save();
    res.json({ success: true, message: "Item removed from cart", cartData: user.cartData });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

/* ────────────────────────────────────────────────────────────────────── */
/*  DELETE /api/cart/clear                                               */
/* ────────────────────────────────────────────────────────────────────── */
export const clearCart = async (req, res) => {
  try {
    const userId = req.body.userId;

    await userModel.findByIdAndUpdate(userId, { cartData: [] });

    res.json({ success: true, message: "Cart cleared", cartData: [] });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

/* ────────────────────────────────────────────────────────────────────── */
/*  POST /api/cart/merge  — merge guest localStorage cart after login    */
/* ────────────────────────────────────────────────────────────────────── */
export const mergeCart = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { guestCart } = req.body; // array of { productId, size, color, quantity }

    if (!guestCart || !Array.isArray(guestCart) || guestCart.length === 0) {
      return res.json({ success: true, message: "Nothing to merge" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    for (const guestItem of guestCart) {
      const product = await productModel.findById(guestItem.productId);
      if (!product) continue;

      const existingIdx = user.cartData.findIndex(
        (item) =>
          item.productId.toString() === guestItem.productId &&
          (item.size || "") === (guestItem.size || "") &&
          (item.color || "") === (guestItem.color || "")
      );

      const qty = guestItem.quantity || 1;
      const available = getAvailableStock(product, guestItem.size, guestItem.color);

      if (existingIdx >= 0) {
        const newQty = user.cartData[existingIdx].quantity + qty;
        user.cartData[existingIdx].quantity =
          available !== Infinity ? Math.min(newQty, available) : newQty;
      } else {
        const safeQty =
          available !== Infinity ? Math.min(qty, available) : qty;
        if (safeQty > 0) {
          user.cartData.push(
            buildCartItem(product, guestItem.size, guestItem.color, safeQty)
          );
        }
      }
    }

    await user.save();

    res.json({ success: true, message: "Cart merged", cartData: user.cartData });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};
