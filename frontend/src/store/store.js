import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import categoriesReducer from './slices/categorySlice';
import cartReducer from './slices/cartSlice';
import ordersReducer from './slices/orderSlice';
import reviewsReducer from './slices/reviewSlice';
import chatbotReducer from './slices/chatbotSlice';
import recommendationsReducer from './slices/recommendationSlice';

/**
 * Redux Store Configuration
 * Centralized state management for the application
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    categories: categoriesReducer,
    cart: cartReducer,
    orders: ordersReducer,
    reviews: reviewsReducer,
    chatbot: chatbotReducer,
    recommendations: recommendationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization check
        ignoredActions: ['auth/setUser'],
      },
    }),
  devTools: import.meta.env.DEV, // Enable Redux DevTools in development
});

export default store;
