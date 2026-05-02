import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

/**
 * ChatCategoryCard — Premium glassmorphism category card for chatbot responses.
 * Shows category name, description, and a "View Collection" button.
 */
const ChatCategoryCard = ({ item, index = 0 }) => {
  const navigate = useNavigate();

  const handleView = () => {
    if (item.url) {
      navigate(item.url);
    }
  };

  return (
    <motion.div
      className="chat-card-category"
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {/* Category icon */}
      <div className="chat-card-cat-icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-5 h-5"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 6h16M4 12h16M4 18h7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Card content */}
      <div className="chat-card-body flex-1">
        <h4 className="chat-card-title">{item.name}</h4>
        {item.description && (
          <p className="chat-card-desc">{item.description}</p>
        )}
      </div>

      {/* View Collection button */}
      <motion.button
        className="chat-card-btn-cat"
        onClick={handleView}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        View Collection
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-3.5 h-3.5 ml-1"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 12h14M12 5l7 7-7 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.button>
    </motion.div>
  );
};

export default ChatCategoryCard;
