import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ChatProductCard from "./ChatProductCard";
import ChatCategoryCard from "./ChatCategoryCard";
import ChatVariantCard from "./ChatVariantCard";
import ChatCartCard from "./ChatCartCard";
import ChatOrderCard from "./ChatOrderCard";
import ChatConfirmationCard from "./ChatConfirmationCard";
import ChatOrderHistoryCard from "./ChatOrderHistoryCard";
import ChatDiscountCard from "./ChatDiscountCard";

/**
 * ChatMessage — A single premium chat bubble.
 * Renders differently for user vs bot messages.
 * Bot messages can include product/category/variant/cart/order cards.
 */
const ChatMessage = ({ message, index }) => {
  const isUser = message.sender === "user";
  const hasCards = !isUser && message.cards && message.cards.length > 0;
  const navigate = useNavigate();

  /**
   * Render text with markdown links and bold converted to JSX
   */
  const renderText = (text) => {
    if (!text) return null;
    // Split on markdown links [text](url) and bold **text**
    const parts = text.split(/(\[.*?\]\(.*?\)|\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      // Markdown link
      const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        const [, label, href] = linkMatch;
        if (href.startsWith("/")) {
          return (
            <span
              key={i}
              className="chat-inline-link"
              onClick={() => navigate(href)}
            >
              {label}
            </span>
          );
        }
        return (
          <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="chat-inline-link">
            {label}
          </a>
        );
      }
      // Bold
      const boldMatch = part.match(/^\*\*(.*?)\*\*$/);
      if (boldMatch) {
        return <strong key={i}>{boldMatch[1]}</strong>;
      }
      return part;
    });
  };

  /**
   * Render the correct card component based on card type
   */
  const renderCard = (card, cardIdx) => {
    const cardType = card.type;

    switch (cardType) {
      // ── Product cards (array of items) ──
      case "product_card":
        return (
          <div key={cardIdx} className="chat-cards-grid">
            {card.items?.map((item, itemIdx) => (
              <ChatProductCard
                key={item.id || itemIdx}
                item={item}
                index={itemIdx}
              />
            ))}
          </div>
        );

      // ── Category cards (array of items) ──
      case "category_card":
        return (
          <div key={cardIdx} className="chat-cards-grid">
            {card.items?.map((item, itemIdx) => (
              <ChatCategoryCard
                key={item.id || itemIdx}
                item={item}
                index={itemIdx}
              />
            ))}
          </div>
        );

      // ── Variant info card ──
      case "product_variant_info":
        return (
          <ChatVariantCard key={cardIdx} data={card} index={cardIdx} />
        );

      // ── Cart confirmation (item added) ──
      case "cart_confirmation":
        return (
          <ChatConfirmationCard key={cardIdx} data={card} index={cardIdx} />
        );

      // ── Cart summary ──
      case "cart_summary":
        return (
          <ChatCartCard key={cardIdx} data={card} index={cardIdx} />
        );

      // ── Checkout prompt ──
      case "checkout_prompt":
        return (
          <ChatCartCard key={cardIdx} data={card} index={cardIdx} />
        );

      // ── Order preview (before confirm) ──
      case "order_preview":
        return (
          <ChatCartCard key={cardIdx} data={card} index={cardIdx} />
        );

      // ── Order confirmation (after placing) ──
      case "order_confirmation":
        return (
          <ChatOrderCard key={cardIdx} data={card} index={cardIdx} />
        );

      // ── Order history ──
      case "order_history":
        return (
          <ChatOrderHistoryCard key={cardIdx} data={card} index={cardIdx} />
        );

      // ── Discount applied ──
      case "discount_applied":
        return (
          <ChatDiscountCard key={cardIdx} data={card} index={cardIdx} />
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      className={`flex flex-col ${isUser ? "items-end" : "items-start"} mb-4`}
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {/* Text bubble */}
      {message.text && (
        <div
          className={`relative max-w-[80%] px-4 py-3 rounded-2xl ${
            isUser ? "chat-bubble-user" : "chat-bubble-bot"
          }`}
        >
          <p className="text-[13.5px] leading-relaxed tracking-wide whitespace-pre-wrap">
            {isUser ? message.text : renderText(message.text)}
          </p>

          <span
            className={`block text-[10px] mt-1.5 tracking-wider uppercase ${
              isUser
                ? "text-indigo-300/50 text-right"
                : "text-violet-300/40 text-left"
            }`}
          >
            {message.time}
          </span>
        </div>
      )}

      {/* Render cards if present */}
      {hasCards && (
        <div className="chat-cards-container mt-2 w-full">
          {message.cards.map((card, cardIdx) => renderCard(card, cardIdx))}
        </div>
      )}
    </motion.div>
  );
};

export default ChatMessage;
