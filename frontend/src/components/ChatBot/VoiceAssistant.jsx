import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * VoiceAssistant — Premium voice interface for the NOVA chatbot.
 *
 * 🎤 Speech-to-Text (STT):
 *    Primary   → Browser native SpeechRecognition (Chrome/Edge)
 *    Fallback  → MediaRecorder + Whisper via Pollinations API
 *
 * 🔊 Text-to-Speech (TTS): Browser native speechSynthesis API
 *
 * Zero external npm libraries required.
 */

/* ══════════════════════════════════════════
   Feature detection
   ══════════════════════════════════════════ */
const NativeSpeechRecognition =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

const speechSynthesisSupported =
  typeof window !== "undefined" && "speechSynthesis" in window;

const mediaDevicesSupported =
  typeof navigator !== "undefined" &&
  navigator.mediaDevices &&
  typeof navigator.mediaDevices.getUserMedia === "function";

const isSecureContext =
  typeof window !== "undefined" &&
  (window.isSecureContext ||
    window.location.protocol === "https:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

/* ══════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════ */
const stripMarkdown = (text) =>
  (text || "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/[`~>|]/g, "")
    .replace(/\n+/g, ". ")
    .replace(/\s{2,}/g, " ")
    .trim();

/* ══════════════════════════════════════════
   Component
   ══════════════════════════════════════════ */
const VoiceAssistant = ({ onSend, disabled = false, lastBotMessage = "" }) => {
  /* ── State ── */
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState(null);
  const [useNative, setUseNative] = useState(!!NativeSpeechRecognition);

  /* ── Refs ── */
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const isMountedRef = useRef(true);
  const lastSpokenRef = useRef("");

  /* ── Cleanup on unmount ── */
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      try {
        recognitionRef.current?.abort();
      } catch {}
      try {
        mediaRecorderRef.current?.stop();
      } catch {}
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
      } catch {}
      try {
        speechSynthesisSupported && window.speechSynthesis.cancel();
      } catch {}
      recognitionRef.current = null;
      mediaRecorderRef.current = null;
      streamRef.current = null;
    };
  }, []);

  /* ═══════════════════════════════════════════════════
     🎤 STRATEGY A — Native SpeechRecognition (Chrome)
     ═══════════════════════════════════════════════════ */
  const startNativeListening = useCallback(() => {
    if (!NativeSpeechRecognition || !isSecureContext) return false;

    setError(null);

    const recognition = new NativeSpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      if (isMountedRef.current) setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript && isMountedRef.current) {
        onSend(transcript);
      }
    };

    recognition.onerror = (event) => {
      if (!isMountedRef.current) return;
      setIsListening(false);

      switch (event.error) {
        case "not-allowed":
        case "service-not-allowed":
          setError("Microphone access denied. Please allow mic permission.");
          break;
        case "no-speech":
          setError("No speech detected. Tap mic to try again.");
          break;
        case "network":
          // Native failed → auto-switch to fallback for this & future attempts
          console.log(
            "[VoiceAssistant] Native STT network error → switching to recording mode"
          );
          setUseNative(false);
          // Silently start fallback immediately
          setTimeout(() => {
            if (isMountedRef.current) startFallbackListening();
          }, 100);
          return; // don't show error, we're auto-retrying
        case "aborted":
          break;
        default:
          setError(`Voice error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      if (isMountedRef.current) setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      return true;
    } catch {
      return false;
    }
  }, [onSend]);

  /* ═══════════════════════════════════════════════════════
     🎤 STRATEGY B — MediaRecorder + Whisper (fallback)
     Records audio → sends to Pollinations Whisper endpoint
     ═══════════════════════════════════════════════════════ */
  const startFallbackListening = useCallback(async () => {
    if (!mediaDevicesSupported || !isSecureContext) {
      setError("Microphone not available in this browser.");
      return;
    }

    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Pick best supported MIME
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // Release mic
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        if (!isMountedRef.current) return;

        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];

        if (blob.size < 1000) {
          setError("No speech detected. Tap mic to try again.");
          return;
        }

        // Transcribe via Whisper
        setIsTranscribing(true);
        try {
          const formData = new FormData();
          const ext = mimeType.includes("webm") ? "webm" : "mp4";
          formData.append("file", blob, `recording.${ext}`);
          formData.append("model", "whisper-large-v3");

          const res = await fetch(
            "https://gen.pollinations.ai/v1/audio/transcriptions",
            {
              method: "POST",
              headers: {
                Authorization: "Bearer sk_9DlLpoulsBTzCGXtBGDHQvNSmtWPYFuf",
              },
              body: formData,
            }
          );

          if (!res.ok) {
            const errBody = await res.text().catch(() => "");
            console.error("[VoiceAssistant] Whisper API error:", res.status, errBody);
            throw new Error(`Status ${res.status}`);
          }

          const data = await res.json();
          const transcript = (data.text || "").trim();

          console.log("[VoiceAssistant] Transcript:", transcript || "(empty)");

          if (isMountedRef.current) {
            if (transcript) {
              onSend(transcript);
            } else {
              setError("Couldn't understand. Try speaking louder.");
            }
          }
        } catch (err) {
          console.error("[VoiceAssistant] Whisper transcription error:", err);
          if (isMountedRef.current) {
            setError("Transcription failed. Please try again.");
          }
        } finally {
          if (isMountedRef.current) setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      if (isMountedRef.current) setIsListening(true);
    } catch (err) {
      if (!isMountedRef.current) return;
      if (err.name === "NotAllowedError") {
        setError("Microphone access denied. Please allow mic permission.");
      } else {
        setError("Could not access microphone.");
      }
    }
  }, [onSend]);

  /* ═══════════════════════════════════════
     🎤 Unified start / stop / toggle
     ═══════════════════════════════════════ */
  const startListening = useCallback(() => {
    if (isListening || isTranscribing || disabled) return;

    if (useNative) {
      const ok = startNativeListening();
      if (!ok && mediaDevicesSupported) {
        setUseNative(false);
        startFallbackListening();
      }
    } else {
      startFallbackListening();
    }
  }, [
    isListening,
    isTranscribing,
    disabled,
    useNative,
    startNativeListening,
    startFallbackListening,
  ]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
  }, [isListening, startListening, stopListening]);

  /* ═══════════════════════════════════════
     🔊 Text-to-Speech (TTS)
     ═══════════════════════════════════════ */
  const speak = useCallback((text) => {
    if (!speechSynthesisSupported || !text) return;
    window.speechSynthesis.cancel();

    const cleaned = stripMarkdown(text);
    if (!cleaned || cleaned.length < 3) return;

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.includes("Google") ||
          v.name.includes("Samantha") ||
          v.name.includes("Female"))
    );
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => isMountedRef.current && setIsSpeaking(true);
    utterance.onend = () => isMountedRef.current && setIsSpeaking(false);
    utterance.onerror = () => isMountedRef.current && setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  /* Auto-speak bot replies when TTS on */
  useEffect(() => {
    if (
      ttsEnabled &&
      lastBotMessage &&
      lastBotMessage !== lastSpokenRef.current
    ) {
      lastSpokenRef.current = lastBotMessage;
      const t = setTimeout(() => speak(lastBotMessage), 300);
      return () => clearTimeout(t);
    }
  }, [ttsEnabled, lastBotMessage, speak]);

  /* Stop speech when TTS toggled off */
  useEffect(() => {
    if (!ttsEnabled && speechSynthesisSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [ttsEnabled]);

  /* Auto-clear error */
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 4500);
      return () => clearTimeout(t);
    }
  }, [error]);

  /* ═══════════════════════════════════════
     🎨 Render
     ═══════════════════════════════════════ */
  const canDoVoice =
    (NativeSpeechRecognition || mediaDevicesSupported) && isSecureContext;

  return (
    <div className="voice-assistant">
      {/* Error toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="voice-error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
          >
            <svg
              className="w-3.5 h-3.5 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Listening / Transcribing indicator */}
      <AnimatePresence>
        {(isListening || isTranscribing) && (
          <motion.div
            className="voice-listening-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <span className="voice-listening-dot" />
            <span>{isTranscribing ? "Transcribing…" : "Listening…"}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="voice-controls">
        {/* TTS toggle */}
        {speechSynthesisSupported && (
          <motion.button
            className={`voice-tts-toggle ${ttsEnabled ? "voice-tts-on" : ""}`}
            onClick={() => setTtsEnabled((prev) => !prev)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title={ttsEnabled ? "Voice replies ON" : "Voice replies OFF"}
            aria-label={
              ttsEnabled ? "Disable voice replies" : "Enable voice replies"
            }
          >
            {ttsEnabled ? (
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            )}
            {isSpeaking && <span className="voice-speaking-dot" />}
          </motion.button>
        )}

        {/* Mic button */}
        {canDoVoice && (
          <motion.button
            className={`voice-mic-btn ${
              isListening ? "voice-mic-active" : ""
            } ${isTranscribing ? "voice-mic-transcribing" : ""}`}
            onClick={toggleListening}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            disabled={disabled || isTranscribing}
            title={
              isTranscribing
                ? "Transcribing…"
                : isListening
                ? "Stop listening"
                : "Voice input"
            }
            aria-label={
              isTranscribing
                ? "Transcribing audio"
                : isListening
                ? "Stop voice input"
                : "Start voice input"
            }
          >
            {/* Pulse rings */}
            <AnimatePresence>
              {isListening && (
                <>
                  <motion.span
                    className="voice-pulse-ring"
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                  <motion.span
                    className="voice-pulse-ring"
                    initial={{ scale: 1, opacity: 0.4 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "easeOut",
                      delay: 0.4,
                    }}
                  />
                </>
              )}
            </AnimatePresence>

            {/* Transcribing spinner or Mic icon */}
            {isTranscribing ? (
              <motion.svg
                className="w-5 h-5 relative z-10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              </motion.svg>
            ) : (
              <svg
                className="w-5 h-5 relative z-10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="1" width="6" height="13" rx="3" />
                <path d="M19 10v2a7 7 0 01-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default VoiceAssistant;
