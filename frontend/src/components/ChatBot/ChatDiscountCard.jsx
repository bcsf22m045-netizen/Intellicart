import { motion } from "framer-motion";

/**
 * ChatDiscountCard — Premium discount applied card with animations.
 * Shows strikethrough original prices, highlighted new prices,
 * savings per item, and total savings.
 */
const ChatDiscountCard = ({ data, index = 0 }) => {
  if (!data) return null;

  const {
    items = [],
    totalSavings = 0,
    newCartTotal = 0,
    subtotal = 0,
    deliveryFee = 0,
  } = data;

  return (
    <motion.div
      className="chat-discount-card"
      initial={{ opacity: 0, y: 20, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {/* Header */}
      <div className="chat-discount-header">
        <motion.span
          className="chat-discount-icon"
          initial={{ rotate: -20, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }}
        >
          🏷️
        </motion.span>
        <h4 className="chat-discount-title">Discount Applied!</h4>
        <motion.div
          className="chat-discount-savings-badge"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 12, delay: 0.4 }}
        >
          Save ${totalSavings.toFixed(2)}
        </motion.div>
      </div>

      {/* Discounted Items */}
      <div className="chat-discount-items">
        {items.map((item, i) => (
          <motion.div
            key={item.productId || i}
            className="chat-discount-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
          >
            <div className="chat-discount-item-info">
              <span className="chat-discount-item-name">{item.name}</span>
            </div>
            <div className="chat-discount-item-pricing">
              <motion.span
                className="chat-discount-old-price"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0.6 }}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
              >
                ${item.oldPrice.toFixed(2)}
              </motion.span>
              <motion.span
                className="chat-discount-arrow"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.6 + i * 0.1 }}
              >
                →
              </motion.span>
              <motion.span
                className="chat-discount-new-price"
                initial={{ opacity: 0, scale: 1.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.7 + i * 0.1 }}
              >
                ${item.newPrice.toFixed(2)}
              </motion.span>
              <motion.span
                className="chat-discount-item-save"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.8 + i * 0.1 }}
              >
                -${item.savings.toFixed(2)}
              </motion.span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Totals */}
      <motion.div
        className="chat-discount-totals"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <div className="chat-discount-total-row">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="chat-discount-total-row">
          <span>Delivery</span>
          <span>${deliveryFee.toFixed(2)}</span>
        </div>
        <div className="chat-discount-total-row chat-discount-savings-row">
          <span>💰 You Save</span>
          <span className="chat-discount-savings-amount">-${totalSavings.toFixed(2)}</span>
        </div>
        <div className="chat-discount-total-row chat-discount-final-row">
          <span>New Total</span>
          <motion.span
            className="chat-discount-final-price"
            initial={{ scale: 1.3, color: "#10b981" }}
            animate={{ scale: 1, color: "#10b981" }}
            transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.8 }}
          >
            ${newCartTotal.toFixed(2)}
          </motion.span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ChatDiscountCard;
