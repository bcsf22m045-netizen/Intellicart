import { useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import SplineRobot from "./SplineRobot";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

/**
 * TypingIndicator — Animated "..." dots for bot typing state.
 */
const TypingIndicator = () => (
  <motion.div
    className="flex justify-start mb-4"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="chat-bubble-bot px-5 py-3 flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-violet-400/70"
          animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.18,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  </motion.div>
);

/**
 * ChatPanel — The full premium chat window.
 * Now connected to Redux for real AI responses.
 */
const ChatPanel = ({ messages, isTyping, onSend, onClose }) => {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Extract the latest bot text for TTS
  const lastBotMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "bot" && m.text) return m.text;
    }
    return "";
  }, [messages]);

  return (
    <motion.div
      className="chat-panel"
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 28, stiffness: 260 }}
    >
      {/* ===== HEADER ===== */}
      <div className="chat-panel-header">
        {/* Robot avatar inside chat */}
        <div className="chat-panel-robot">
          <SplineRobot variant="panel" size={90} />
        </div>

        {/* Title */}
        <div className="text-center mt-1">
          <h2 className="text-lg font-semibold tracking-wider text-white/90">
            IntelliCart AI
          </h2>
          <p className="text-[11px] tracking-[0.2em] uppercase text-violet-300/50 mt-0.5">
            Your Shopping Assistant
          </p>
        </div>

        {/* Close button */}
        <motion.button
          onClick={onClose}
          className="chat-close-btn"
          whileHover={{ scale: 1.15, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Close chat"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.button>
      </div>

      {/* ===== MESSAGES ===== */}
      <div className="chat-messages-area">
        {messages.map((msg, i) => (
          <ChatMessage key={msg.id || i} message={msg} index={i} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* ===== INPUT ===== */}
      <ChatInput onSend={onSend} disabled={isTyping} lastBotMessage={lastBotMessage} />
    </motion.div>
  );
};

export default ChatPanel;
