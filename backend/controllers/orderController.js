import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import { sendOrderConfirmationEmail } from "../config/email.js";

const DELIVERY_FEE = 10;

/* ── Helper: deduct stock for a product+size+color ──────────────────── */
const deductStock = async (productId, size, color, quantity) => {
  const product = await productModel.findById(productId);
  if (!product) return { ok: false, message: `Product ${productId} not found` };

  // If product has no stock array, skip deduction
  if (!product.stock || product.stock.length === 0) return { ok: true };

  const stockIdx = product.stock.findIndex(
    (s) =>
      (s.size || "") === (size || "") && (s.color || "") === (color || "")
  );

  if (stockIdx < 0) {
    return { ok: false, message: `No stock entry for ${product.name} (${size}/${color})` };
  }

  if (product.stock[stockIdx].quantity < quantity) {
    return {
      ok: false,
      message: `Insufficient stock for ${product.name} (${size}/${color}). Available: ${product.stock[stockIdx].quantity}`,
    };
  }

  product.stock[stockIdx].quantity -= quantity;
  await product.save();
  return { ok: true };
};

/* ────────────────────────────────────────────────────────────────────── */
/*  POST /api/order/place — COD only                                     */
/* ────────────────────────────────────────────────────────────────────── */
export const placeOrder = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { items, shippingAddress } = req.body;

    // ── Validate inputs ──
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.json({ success: false, message: "Cart is empty" });
    }
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.email || !shippingAddress.phone || !shippingAddress.address || !shippingAddress.city || !shippingAddress.postalCode) {
      return res.json({ success: false, message: "Complete shipping address is required (including email)" });
    }

    // ── Validate & prepare order items, check stock ──
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await productModel.findById(item.productId);
      if (!product) {
        return res.json({ success: false, message: `Product not found: ${item.productId}` });
      }

      // Determine price (variant or base)
      let itemPrice = product.basePrice ?? 0;
      if (product.variants && product.variants.length > 0) {
        const variant = product.variants.find(
          (v) =>
            (!v.size || v.size === (item.size || "")) &&
            (!v.color || v.color === (item.color || ""))
        );
        if (variant && variant.price) itemPrice = variant.price;
      }

      // Check stock availability
      if (product.stock && product.stock.length > 0) {
        const stockEntry = product.stock.find(
          (s) =>
            (s.size || "") === (item.size || "") &&
            (s.color || "") === (item.color || "")
        );
        if (!stockEntry || stockEntry.quantity < item.quantity) {
          const avail = stockEntry ? stockEntry.quantity : 0;
          return res.json({
            success: false,
            message: `Insufficient stock for ${product.name} (${item.size || "N/A"}/${item.color || "N/A"}). Available: ${avail}`,
          });
        }
      }

      // Get image
      let image = "";
      if (product.images && product.images.length > 0) {
        const colorImg = item.color
          ? product.images.find((img) => img.color === item.color)
          : null;
        image = colorImg ? colorImg.url : product.images[0].url;
      }

      const lineTotal = itemPrice * item.quantity;
      subtotal += lineTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        image,
        size: item.size || "",
        color: item.color || "",
        quantity: item.quantity,
        price: itemPrice,
      });
    }

    const totalPrice = subtotal + DELIVERY_FEE;

    // ── Deduct stock ──
    for (const item of orderItems) {
      const result = await deductStock(item.product, item.size, item.color, item.quantity);
      if (!result.ok) {
        return res.json({ success: false, message: result.message });
      }
    }

    // ── Create order ──
    const newOrder = new orderModel({
      user: userId,
      items: orderItems,
      shippingAddress,
      paymentMethod: "Cash on Delivery",
      totalPrice,
      orderStatus: "Pending",
      isPaid: false,
    });

    await newOrder.save();

    // ── Clear user cart ──
    await userModel.findByIdAndUpdate(userId, { cartData: [] });

    // ── Send confirmation email (non-blocking) ──
    sendOrderConfirmationEmail(newOrder).catch((err) =>
      console.error("Failed to send order confirmation email:", err)
    );

    res.json({
      success: true,
      message: "Order placed successfully!",
      order: newOrder,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

/* ────────────────────────────────────────────────────────────────────── */
/*  GET /api/order/my — authenticated user's orders                      */
/* ────────────────────────────────────────────────────────────────────── */
export const userOrders = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const orders = await orderModel
      .find({ user: userId })
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

/* ────────────────────────────────────────────────────────────────────── */
/*  GET /api/admin/orders — all orders for admin                         */
/* ────────────────────────────────────────────────────────────────────── */
export const allOrders = async (req, res) => {
  try {
    const orders = await orderModel
      .find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

/* ────────────────────────────────────────────────────────────────────── */
/*  PUT /api/admin/order/:id/status — admin update order status          */
/* ────────────────────────────────────────────────────────────────────── */
export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.json({ success: false, message: "Invalid status" });
    }

    const order = await orderModel.findById(id);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // If marking as delivered, set isPaid to true (COD collected)
    const update = { orderStatus: status };
    if (status === "Delivered") {
      update.isPaid = true;
    }

    // If cancelling, restore stock
    if (status === "Cancelled" && order.orderStatus !== "Cancelled") {
      for (const item of order.items) {
        const product = await productModel.findById(item.product);
        if (product && product.stock && product.stock.length > 0) {
          const stockIdx = product.stock.findIndex(
            (s) =>
              (s.size || "") === (item.size || "") &&
              (s.color || "") === (item.color || "")
          );
          if (stockIdx >= 0) {
            product.stock[stockIdx].quantity += item.quantity;
            await product.save();
          }
        }
      }
    }

    const updated = await orderModel.findByIdAndUpdate(id, update, { new: true }).populate("user", "name email");

    res.json({ success: true, message: "Status updated", order: updated });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

/* ────────────────────────────────────────────────────────────────────── */
/*  GET /api/admin/order/:id — admin get single order details            */
/* ────────────────────────────────────────────────────────────────────── */
export const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderModel.findById(id).populate("user", "name email");

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
