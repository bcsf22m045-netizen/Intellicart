import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

/**
 * ChatOrderHistoryCard — Shows user's recent orders in the chatbot.
 * Renders a list of order cards with status, items, total, and date.
 */
const statusColors = {
  Pending: { bg: "rgba(234,179,8,0.15)", color: "#facc15", border: "rgba(234,179,8,0.3)" },
  Confirmed: { bg: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "rgba(59,130,246,0.3)" },
  Shipped: { bg: "rgba(139,92,246,0.15)", color: "#a78bfa", border: "rgba(139,92,246,0.3)" },
  Delivered: { bg: "rgba(34,197,94,0.15)", color: "#4ade80", border: "rgba(34,197,94,0.3)" },
  Cancelled: { bg: "rgba(239,68,68,0.15)", color: "#f87171", border: "rgba(239,68,68,0.3)" },
};

const ChatOrderHistoryCard = ({ data, index = 0 }) => {
  const navigate = useNavigate();

  if (!data || !data.orders || data.orders.length === 0) return null;

  const { orders } = data;

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <motion.div
      className="chat-order-history"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      {orders.map((order, i) => {
        const shortId = (order.orderId || "").slice(-8).toUpperCase();
        const sc = statusColors[order.status] || statusColors.Pending;

        return (
          <motion.div
            key={order.orderId || i}
            className="chat-oh-card"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.1 + i * 0.08 }}
          >
            {/* Header row */}
            <div className="chat-oh-header">
              <div className="chat-oh-id-group">
                <span className="chat-oh-icon">📦</span>
                <span className="chat-oh-id">#{shortId}</span>
              </div>
              <span
                className="chat-oh-status"
                style={{
                  background: sc.bg,
                  color: sc.color,
                  border: `1px solid ${sc.border}`,
                }}
              >
                {order.status}
              </span>
            </div>

            {/* Date */}
            {order.date && (
              <span className="chat-oh-date">{formatDate(order.date)}</span>
            )}

            {/* Items */}
            <div className="chat-oh-items">
              {order.items.slice(0, 3).map((item, j) => (
                <div key={j} className="chat-oh-item">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="chat-oh-item-img"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  )}
                  <div className="chat-oh-item-info">
                    <span className="chat-oh-item-name">{item.name}</span>
                    <span className="chat-oh-item-variant">
                      {[item.size, item.color].filter(Boolean).join(" · ") || "—"}
                      {item.quantity > 1 && ` × ${item.quantity}`}
                    </span>
                  </div>
                  <span className="chat-oh-item-price">
                    ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                  </span>
                </div>
              ))}
              {order.items.length > 3 && (
                <span className="chat-oh-more">+{order.items.length - 3} more</span>
              )}
            </div>

            {/* Total */}
            <div className="chat-oh-total">
              <span>Total</span>
              <span className="chat-oh-total-value">
                ${(order.total || 0).toFixed(2)}
              </span>
            </div>
          </motion.div>
        );
      })}

      {/* View all orders button */}
      <button
        className="chat-oh-view-all"
        onClick={() => navigate("/orders")}
      >
        View All Orders →
      </button>
    </motion.div>
  );
};

export default ChatOrderHistoryCard;
