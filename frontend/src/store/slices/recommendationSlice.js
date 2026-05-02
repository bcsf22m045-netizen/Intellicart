import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

/* ── Fetch ML-powered recommendations for a product (public) ────────── */
export const fetchRecommendations = createAsyncThunk(
  "recommendations/fetchRecommendations",
  async ({ productId, limit = 8 }, { rejectWithValue }) => {
    try {
      const res = await axios.get(
        `${BACKEND_URL}/api/recommendations/${productId}`,
        { params: { limit } }
      );
      if (res.data.success) {
        return {
          products: res.data.recommendations,
          source: res.data.source,
          modelInfo: res.data.modelInfo,
        };
      }
      return rejectWithValue(res.data.message);
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

/* ── Slice ────────────────────────────────────────────────────────────── */
const recommendationSlice = createSlice({
  name: "recommendations",
  initialState: {
    products: [],
    source: null, // 'ml_model' | 'category_fallback'
    modelInfo: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearRecommendations: (state) => {
      state.products = [];
      state.source = null;
      state.modelInfo = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecommendations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.source = action.payload.source;
        state.modelInfo = action.payload.modelInfo;
      })
      .addCase(fetchRecommendations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch recommendations";
      });
  },
});

export const { clearRecommendations } = recommendationSlice.actions;

/* ── Selectors ────────────────────────────────────────────────────────── */
export const selectRecommendations = (state) =>
  state.recommendations.products;
export const selectRecommendationsLoading = (state) =>
  state.recommendations.loading;
export const selectRecommendationsSource = (state) =>
  state.recommendations.source;
export const selectRecommendationsModelInfo = (state) =>
  state.recommendations.modelInfo;
export const selectRecommendationsError = (state) =>
  state.recommendations.error;

export default recommendationSlice.reducer;
