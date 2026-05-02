import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${backendUrl}/api/product/list`);
      if (res.data.success) return res.data.products;
      return rejectWithValue(res.data.message);
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

export const fetchSingleProduct = createAsyncThunk(
  "products/fetchSingleProduct",
  async (productId, { rejectWithValue }) => {
    try {
      const res = await axios.get(
        `${backendUrl}/api/product/single/${productId}`
      );
      if (res.data.success) return res.data.product;
      return rejectWithValue(res.data.message);
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

export const deleteProduct = createAsyncThunk(
  "products/deleteProduct",
  async ({ id, token }, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${backendUrl}/api/product/remove`,
        { id },
        { headers: { token } }
      );
      if (res.data.success) return id;
      return rejectWithValue(res.data.message);
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const productSlice = createSlice({
  name: "products",
  initialState: {
    items: [],
    currentProduct: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── fetchProducts ──
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // ── fetchSingleProduct ──
      .addCase(fetchSingleProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSingleProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchSingleProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // ── deleteProduct ──
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p._id !== action.payload);
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearCurrentProduct, clearError } = productSlice.actions;

// Selectors
export const selectProducts = (state) => state.products.items;
export const selectCurrentProduct = (state) => state.products.currentProduct;
export const selectProductsLoading = (state) => state.products.loading;
export const selectProductsError = (state) => state.products.error;

export default productSlice.reducer;
