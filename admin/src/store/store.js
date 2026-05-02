import { configureStore } from "@reduxjs/toolkit";
import productFormReducer from "./slices/productFormSlice";
import productsReducer from "./slices/productSlice";
import categoriesReducer from "./slices/categorySlice";
import adminOrdersReducer from "./slices/adminOrderSlice";
import adminReviewsReducer from "./slices/adminReviewSlice";

const store = configureStore({
  reducer: {
    productForm: productFormReducer,
    products: productsReducer,
    categories: categoriesReducer,
    adminOrders: adminOrdersReducer,
    adminReviews: adminReviewsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore File objects in state (image files)
        ignoredPaths: ["productForm.imageFiles"],
        ignoredActions: [
          "productForm/setImageFile",
          "productForm/removeImage",
          "productForm/resetForm",
        ],
      },
    }),
});

export default store;
