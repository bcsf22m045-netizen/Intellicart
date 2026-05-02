import { motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { sendChatMessage, addUserMessage } from "../../store/slices/chatbotSlice";
import { fetchCart } from "../../store/slices/cartSlice";

/**
 * ChatCartCard — Premium glassmorphism cart summary card.
 * Shows item list, subtotal, delivery fee, total.
 * Also used for checkout_prompt and order_preview.
 */
const ChatCartCard = ({ data, index = 0 }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  if (!data) return null;

  const {
    type,
    items = [],
    subtotal = 0,
    deliveryFee = 0,
    total = 0,
    shipping,
    paymentMethod,
    cart,
  } = data;

  // For order_preview, use cart data
  const displayItems = items.length > 0 ? items : cart?.items || [];
  const displaySubtotal = subtotal || cart?.subtotal || 0;
  const displayDelivery = deliveryFee || cart?.deliveryFee || 0;
  const displayTotal = total || cart?.total || 0;
  const displayOriginalSubtotal = data.originalSubtotal || cart?.originalSubtotal || null;
  const displayDiscountAmount = data.discountAmount || cart?.discountAmount || 0;

  const isCheckout = type === "checkout_prompt" || type === "order_preview";

  return (
    <motion.div
      className={`chat-cart-card ${isCheckout ? "chat-cart-checkout" : ""}`}
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {/* Header */}
      <div className="chat-cart-header">
        <span className="chat-cart-icon">
          {isCheckout ? "📦" : "🛒"}
        </span>
        <h4 className="chat-cart-title">
          {type === "order_preview"
            ? "Order Preview"
            : type === "checkout_prompt"
            ? "Checkout"
            : "Your Cart"}
        </h4>
        <span className="chat-cart-count">
          {displayItems.length} item{displayItems.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Items */}
      <div className="chat-cart-items">
        {displayItems.slice(0, 6).map((item, i) => (
          <div key={i} className="chat-cart-item">
            {item.image && (
              <img
                src={item.image}
                alt={item.name}
                className="chat-cart-item-img"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            )}
            <div className="chat-cart-item-info">
              <span className="chat-cart-item-name">{item.name}</span>
              <span className="chat-cart-item-variant">
                {[item.size, item.color].filter(Boolean).join(" · ") || "—"}
                {item.quantity > 1 && ` × ${item.quantity}`}
              </span>
            </div>
            <span className="chat-cart-item-price">
              {item.isDiscounted ? (
                <>
                  <span className="chat-cart-item-original-price">
                    ${((item.originalPrice || item.price) * (item.quantity || 1)).toFixed(2)}
                  </span>
                  <span className="chat-cart-item-discounted-price">
                    ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                  </span>
                </>
              ) : (
                `$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}`
              )}
            </span>
          </div>
        ))}
        {displayItems.length > 6 && (
          <div className="chat-cart-more">
            +{displayItems.length - 6} more items
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="chat-cart-totals">
        <div className="chat-cart-total-row">
          <span>Subtotal</span>
          <span>${displaySubtotal.toFixed(2)}</span>
        </div>
        {displayDiscountAmount > 0 && (
          <div className="chat-cart-total-row chat-cart-discount-row">
            <span>💰 Discount</span>
            <span className="chat-cart-discount-amount">-${displayDiscountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="chat-cart-total-row">
          <span>Delivery</span>
          <span>${displayDelivery.toFixed(2)}</span>
        </div>
        <div className="chat-cart-total-row chat-cart-grand-total">
          <span>Total</span>
          <span>${displayTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Shipping info for order_preview */}
      {shipping && (
        <div className="chat-cart-shipping">
          <span className="chat-cart-ship-label">📍 Ship to:</span>
          <span className="chat-cart-ship-value">
            {shipping.fullName}, {shipping.address}, {shipping.city} {shipping.postalCode}
          </span>
          {paymentMethod && (
            <span className="chat-cart-ship-payment">
              💳 {paymentMethod}
            </span>
          )}
        </div>
      )}

      {/* Confirm / Cancel buttons for order_preview */}
      {type === "order_preview" && (
        <div className="chat-cart-actions">
          <button
            className="chat-cart-btn chat-cart-btn-confirm"
            onClick={() => {
              dispatch(addUserMessage("confirm"));
              dispatch(sendChatMessage("confirm"));
            }}
          >
            ✅ Confirm Order
          </button>
          <button
            className="chat-cart-btn chat-cart-btn-cancel"
            onClick={() => {
              dispatch(addUserMessage("cancel"));
              dispatch(sendChatMessage("cancel"));
            }}
          >
            ✕ Cancel
          </button>
          <button
            className="chat-cart-btn chat-cart-btn-view"
            onClick={() => {
              dispatch(fetchCart()).then(() => {
                navigate("/place-order", {
                  state: {
                    fromChatbot: true,
                    shippingData: shipping || null,
                  },
                });
              });
            }}
          >
            📋 View Checkout Page
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default ChatCartCard;
