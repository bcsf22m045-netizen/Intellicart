import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

/**
 * ChatOrderCard — Premium glassmorphism order confirmation card.
 * Shows orderId, items summary, total, status, shipping.
 */
const ChatOrderCard = ({ data, index = 0 }) => {
  if (!data) return null;
  const navigate = useNavigate();

  const {
    orderId = "",
    items = [],
    total = 0,
    status = "Order Placed",
    shipping,
  } = data;

  const shortId = orderId.slice(-8).toUpperCase();

  return (
    <motion.div
      className="chat-order-card"
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {/* Success header */}
      <div className="chat-order-header">
        <motion.div
          className="chat-order-check"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 10, stiffness: 200, delay: 0.3 }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
            <path
              d="M20 6L9 17L4 12"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
        <div className="chat-order-title-group">
          <h4 className="chat-order-title">Order Confirmed!</h4>
          <span className="chat-order-id">#{shortId}</span>
        </div>
      </div>

      {/* Status badge */}
      <div className="chat-order-status-row">
        <span className="chat-order-status-badge">{status}</span>
      </div>

      {/* Items summary */}
      <div className="chat-order-items">
        {items.slice(0, 4).map((item, i) => (
          <div key={i} className="chat-order-item">
            <span className="chat-order-item-name">
              {item.name}
              {item.size && ` (${item.size})`}
              {item.color && ` — ${item.color}`}
            </span>
            <span className="chat-order-item-qty">×{item.quantity || 1}</span>
          </div>
        ))}
        {items.length > 4 && (
          <div className="chat-order-more">+{items.length - 4} more</div>
        )}
      </div>

      {/* Total */}
      <div className="chat-order-total">
        <span>Total Paid</span>
        <span className="chat-order-total-value">${total.toFixed(2)}</span>
      </div>

      {/* Shipping */}
      {shipping && (
        <div className="chat-order-shipping">
          <span className="chat-order-ship-icon">📍</span>
          <span>
            {shipping.fullName}, {shipping.address}, {shipping.city} {shipping.postalCode}
          </span>
        </div>
      )}

      {/* View My Orders button */}
      <motion.button
        className="chat-order-view-btn"
        onClick={() => navigate("/orders")}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
          <path
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        View My Orders
      </motion.button>
    </motion.div>
  );
};

export default ChatOrderCard;
