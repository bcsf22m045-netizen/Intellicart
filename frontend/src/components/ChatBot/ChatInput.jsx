import { useState, useRef } from "react";
import { motion } from "framer-motion";
import VoiceAssistant from "./VoiceAssistant";

/**
 * ChatInput — Premium glass input bar with gradient send button + voice.
 */
const ChatInput = ({ onSend, disabled = false, lastBotMessage = "" }) => {
  const [value, setValue] = useState("");
  const inputRef = useRef(null);

  const handleSend = (text) => {
    const msg = text || value.trim();
    if (!msg || disabled) return;
    onSend(msg);
    setValue("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-input-wrapper">
      <div className="chat-input-container">
        {/* Input field */}
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me about products…"
          className="chat-input-field"
          autoComplete="off"
          spellCheck={false}
        />

        {/* Voice assistant (mic + TTS toggle) */}
        <VoiceAssistant
          onSend={handleSend}
          disabled={disabled}
          lastBotMessage={lastBotMessage}
        />

        {/* Send button */}
        <motion.button
          onClick={() => handleSend()}
          className="chat-send-btn"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          disabled={!value.trim() || disabled}
          aria-label="Send message"
        >
          {/* Send arrow icon */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5.4 12H18.6M18.6 12L13.2 6.6M18.6 12L13.2 17.4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.button>
      </div>
    </div>
  );
};

export default ChatInput;
