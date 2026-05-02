import { motion } from "framer-motion";

/**
 * ChatVariantCard — Premium glassmorphism card for product variant info.
 * Shows product image, name, price, size chips, color swatches, stock badges.
 */
const ChatVariantCard = ({ data, index = 0 }) => {
  if (!data) return null;

  const {
    name,
    image,
    basePrice,
    minPrice,
    availableSizes = [],
    availableColors = [],
    stockInfo = [],
  } = data;

  // Count total stock
  const totalStock = stockInfo.reduce((sum, s) => sum + s.quantity, 0);

  return (
    <motion.div
      className="chat-variant-card"
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {/* Header with image + name */}
      <div className="chat-variant-header">
        {image && (
          <div className="chat-variant-img-wrap">
            <img
              src={image}
              alt={name}
              className="chat-variant-img"
              loading="lazy"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          </div>
        )}
        <div className="chat-variant-info">
          <h4 className="chat-variant-name">{name}</h4>
          <div className="chat-variant-price-row">
            <span className="chat-variant-price">${basePrice}</span>
            {minPrice && minPrice < basePrice && (
              <span className="chat-variant-min-price">from ${minPrice}</span>
            )}
          </div>
          <span
            className={`chat-variant-stock-badge ${
              totalStock === 0
                ? "out-of-stock"
                : totalStock <= 5
                ? "low-stock"
                : "in-stock"
            }`}
          >
            {totalStock === 0
              ? "Out of Stock"
              : totalStock <= 5
              ? `Low Stock (${totalStock} left)`
              : "In Stock"}
          </span>
        </div>
      </div>

      {/* Sizes */}
      {availableSizes.length > 0 && (
        <div className="chat-variant-section">
          <span className="chat-variant-label">Sizes</span>
          <div className="chat-variant-chips">
            {availableSizes.map((size) => {
              const sizeStock = stockInfo.filter((s) => s.size === size);
              const qty = sizeStock.reduce((sum, s) => sum + s.quantity, 0);
              return (
                <span
                  key={size}
                  className={`chat-variant-chip ${qty === 0 ? "chip-out" : ""}`}
                >
                  {size}
                  {qty === 0 && (
                    <span className="chip-line" />
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Colors */}
      {availableColors.length > 0 && (
        <div className="chat-variant-section">
          <span className="chat-variant-label">Colors</span>
          <div className="chat-variant-colors">
            {availableColors.map((color) => (
              <div key={color.name} className="chat-variant-color-item">
                <span
                  className="chat-variant-swatch"
                  style={{ background: color.hex || "#888" }}
                  title={color.name}
                />
                <span className="chat-variant-color-name">{color.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock breakdown */}
      {stockInfo.length > 0 && stockInfo.length <= 12 && (
        <div className="chat-variant-section">
          <span className="chat-variant-label">Stock Details</span>
          <div className="chat-variant-stock-grid">
            {stockInfo.map((s, i) => (
              <div
                key={i}
                className={`chat-variant-stock-item ${
                  s.status === "Out of stock"
                    ? "stock-out"
                    : s.status === "Low stock"
                    ? "stock-low"
                    : "stock-ok"
                }`}
              >
                <span className="stock-combo">
                  {s.size || "OS"}/{s.color || "—"}
                </span>
                <span className="stock-qty">{s.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ChatVariantCard;
