import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import SplineRobot from "./SplineRobot";
import ChatPanel from "./ChatPanel";
import {
  fetchGreeting,
  sendChatMessage,
  addUserMessage,
  clearChat,
  selectChatMessages,
  selectIsTyping,
  selectGreetingFetched,
} from "../../store/slices/chatbotSlice";

/**
 * ChatWidget — Main orchestrator for the floating robot + chat panel.
 * Connected to Redux for real AI chatbot functionality.
 */
const ChatWidget = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const panelRef = useRef(null);
  const dispatch = useDispatch();
  const prevTokenRef = useRef(null);

  // Redux state
  const messages = useSelector(selectChatMessages);
  const isTyping = useSelector(selectIsTyping);
  const greetingFetched = useSelector(selectGreetingFetched);

  // Track auth token from ALL sources (Redux + localStorage)
  // We need a local state so changes from ShopContext/localStorage trigger re-renders
  const reduxToken = useSelector((state) => state.auth?.accessToken) || null;
  const [resolvedToken, setResolvedToken] = useState(() => {
    return reduxToken
      || localStorage.getItem("accessToken")
      || localStorage.getItem("token")
      || null;
  });

  // Poll localStorage to detect ShopContext login/logout (which doesn't update Redux)
  useEffect(() => {
    const syncToken = () => {
      const fresh =
        reduxToken ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        null;
      setResolvedToken((prev) => (prev !== fresh ? fresh : prev));
    };
    // Sync immediately when Redux token changes
    syncToken();
    // Also poll for localStorage-only changes (ShopContext login)
    const id = setInterval(syncToken, 1000);
    return () => clearInterval(id);
  }, [reduxToken]);

  /* ── Re-fetch greeting when auth state changes (login/logout) ── */
  useEffect(() => {
    if (prevTokenRef.current !== undefined && prevTokenRef.current !== resolvedToken) {
      // Auth state changed — clear chat and re-fetch greeting
      dispatch(clearChat());
      // If chat is already open, immediately re-fetch greeting
      if (isChatOpen) {
        setTimeout(() => dispatch(fetchGreeting()), 100);
      }
    }
    prevTokenRef.current = resolvedToken;
  }, [resolvedToken, dispatch, isChatOpen]);

  /* ── Toggle chat ── */
  const openChat = useCallback(() => {
    setIsChatOpen(true);
    // Fetch greeting on first open
    if (!greetingFetched) {
      dispatch(fetchGreeting());
    }
  }, [greetingFetched, dispatch]);

  const closeChat = useCallback(() => setIsChatOpen(false), []);

  /* ── Send a message to AI ── */
  const handleSend = useCallback(
    (text) => {
      dispatch(addUserMessage(text));
      dispatch(sendChatMessage(text));
    },
    [dispatch]
  );

  /* ── ESC to close ── */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && isChatOpen) closeChat();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isChatOpen, closeChat]);

  /* ── Click outside to close ── */
  useEffect(() => {
    const onClick = (e) => {
      if (
        isChatOpen &&
        panelRef.current &&
        !panelRef.current.contains(e.target)
      ) {
        closeChat();
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [isChatOpen, closeChat]);

  /* ── Prevent body scroll when chat is open ── */
  useEffect(() => {
    if (isChatOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isChatOpen]);

  return (
    <>
      {/* ===== BACKDROP ===== */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* ===== FLOATING ROBOT BUTTON ===== */}
      <AnimatePresence>
        {!isChatOpen && (
          <motion.div
            className="fixed bottom-6 right-6 z-[9999] cursor-pointer"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
            onClick={openChat}
            role="button"
            tabIndex={0}
            aria-label="Open chat assistant"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") openChat();
            }}
          >
            {/* Pulse glow behind robot */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)",
                filter: "blur(8px)",
              }}
              animate={{
                scale: [1, 1.8, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Robot directly — no circle background */}
            <motion.div
              whileHover={{
                scale: 1.15,
                filter: "drop-shadow(0 0 20px rgba(139,92,246,0.6))",
              }}
              transition={{ duration: 0.3 }}
            >
              <SplineRobot variant="floating" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== CHAT PANEL ===== */}
      <AnimatePresence>
        {isChatOpen && (
          <div ref={panelRef} className="fixed inset-y-0 right-0 z-[9999]">
            <ChatPanel
              messages={messages}
              isTyping={isTyping}
              onSend={handleSend}
              onClose={closeChat}
            />
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
