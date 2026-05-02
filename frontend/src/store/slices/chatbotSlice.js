import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

/** Helper: get auth token from Redux state or localStorage */
const getToken = (state) =>
  state.auth?.accessToken ||
  localStorage.getItem("accessToken") ||
  localStorage.getItem("token") ||
  "";

/**
 * Fetch personalized greeting from backend
 */
export const fetchGreeting = createAsyncThunk(
  "chatbot/fetchGreeting",
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getToken(getState());
      const res = await axios.get(`${BACKEND_URL}/api/chatbot/greeting`, {
        headers: { token },
      });
      if (res.data.success) {
        return res.data;
      }
      return rejectWithValue(res.data.message || "Failed to fetch greeting");
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Network error");
    }
  }
);

/**
 * Send a message to the AI chatbot
 */
export const sendChatMessage = createAsyncThunk(
  "chatbot/sendMessage",
  async (message, { getState, rejectWithValue }) => {
    try {
      const token = getToken(getState());
      const res = await axios.post(
        `${BACKEND_URL}/api/chatbot/message`,
        { message },
        { headers: { token } }
      );
      if (res.data.success) {
        return res.data.response; // { text, cards }
      }
      return rejectWithValue(res.data.message || "Failed to get response");
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Sorry, something went wrong. Please try again."
      );
    }
  }
);

const initialState = {
  messages: [], // { id, sender: "user"|"bot", text, time, cards?: [] }
  isTyping: false,
  error: null,
  greetingFetched: false,
  userName: null,
};

const chatbotSlice = createSlice({
  name: "chatbot",
  initialState,
  reducers: {
    /** Push a user message into the chat */
    addUserMessage: (state, action) => {
      state.messages.push({
        id: Date.now(),
        sender: "user",
        text: action.payload,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
      state.error = null;
    },
    /** Clear all chat messages */
    clearChat: (state) => {
      state.messages = [];
      state.greetingFetched = false;
      state.error = null;
    },
    /** Reset error */
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Greeting ──
      .addCase(fetchGreeting.fulfilled, (state, action) => {
        const { greeting, userName } = action.payload;
        state.userName = userName;
        state.greetingFetched = true;
        // Only add greeting if no messages yet
        if (state.messages.length === 0) {
          state.messages.push({
            id: Date.now(),
            sender: "bot",
            text: greeting,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          });
        }
      })
      .addCase(fetchGreeting.rejected, (state) => {
        state.greetingFetched = true;
        if (state.messages.length === 0) {
          state.messages.push({
            id: Date.now(),
            sender: "bot",
            text: "Hello! 👋 I'm IntelliCart, your personal shopping assistant. How can I help you today?",
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          });
        }
      })
      // ── Send message ──
      .addCase(sendChatMessage.pending, (state) => {
        state.isTyping = true;
        state.error = null;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.isTyping = false;
        const { text, cards } = action.payload;
        state.messages.push({
          id: Date.now(),
          sender: "bot",
          text: text || "",
          cards: cards || [],
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.isTyping = false;
        state.error = action.payload;
        state.messages.push({
          id: Date.now(),
          sender: "bot",
          text:
            action.payload ||
            "Sorry, I'm having trouble right now. Please try again! 🙏",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
      });
  },
});

export const { addUserMessage, clearChat, clearError } = chatbotSlice.actions;

// Selectors
export const selectChatMessages = (state) => state.chatbot.messages;
export const selectIsTyping = (state) => state.chatbot.isTyping;
export const selectChatError = (state) => state.chatbot.error;
export const selectGreetingFetched = (state) => state.chatbot.greetingFetched;

export default chatbotSlice.reducer;
