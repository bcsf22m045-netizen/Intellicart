import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { fetchCart } from "../../store/slices/cartSlice";

/**
 * ChatConfirmationCard — Small premium card confirming an item was added to cart.
 * Shows item name, size, color, quantity, price, and a View Cart button.
 */
const ChatConfirmationCard = ({ data, index = 0 }) => {
  if (!data || !data.item) return null;

  const { item } = data;
  const navigate = useNavigate();
  const dispatch = useDispatch();

  return (
    <motion.div
      className="chat-confirm-card"
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <div className="chat-confirm-icon">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 10, stiffness: 200, delay: 0.2 }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
            <path
              d="M20 6L9 17L4 12"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      </div>

      <div className="chat-confirm-body">
        <span className="chat-confirm-label">Added to Cart</span>
        <span className="chat-confirm-name">{item.name}</span>
        <div className="chat-confirm-details">
          {item.size && <span className="chat-confirm-tag">{item.size}</span>}
          {item.color && <span className="chat-confirm-tag">{item.color}</span>}
          {item.quantity > 1 && (
            <span className="chat-confirm-tag">×{item.quantity}</span>
          )}
          <span className="chat-confirm-price">${item.price}</span>
        </div>
        <motion.button
          className="chat-confirm-view-cart"
          onClick={() => {
            dispatch(fetchCart()).then(() => navigate("/cart"));
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
            <path
              d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          View Cart
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ChatConfirmationCard;
