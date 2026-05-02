import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

/**
 * ChatProductCard — Premium glassmorphism product card for chatbot responses.
 * Shows product image, name, price, description, and a "View" button.
 */
const ChatProductCard = ({ item, index = 0 }) => {
  const navigate = useNavigate();

  const handleView = () => {
    if (item.url) {
      navigate(item.url);
    }
  };

  return (
    <motion.div
      className="chat-card-product"
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {/* Product image */}
      {item.image && (
        <div className="chat-card-img-wrapper">
          <img
            src={item.image}
            alt={item.name}
            className="chat-card-img"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>
      )}

      {/* Card content */}
      <div className="chat-card-body">
        <h4 className="chat-card-title">{item.name}</h4>
        {item.description && (
          <p className="chat-card-desc">{item.description}</p>
        )}
        <div className="chat-card-footer">
          {item.price && <span className="chat-card-price">{item.price}</span>}
          <motion.button
            className="chat-card-btn"
            onClick={handleView}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View
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
        </div>
      </div>
    </motion.div>
  );
};

export default ChatProductCard;
