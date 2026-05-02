import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const getToken = () =>
  localStorage.getItem("accessToken") || localStorage.getItem("token");

/* ── Fetch reviews for a product (public) ────────────────────────────── */
export const fetchProductReviews = createAsyncThunk(
  "reviews/fetchProductReviews",
  async (productId, { rejectWithValue }) => {
    try {
      const res = await axios.get(
        `${BACKEND_URL}/api/reviews/product/${productId}`
      );
      if (res.data.success) return res.data.reviews;
      return rejectWithValue(res.data.message);
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

/* ── Create a review (auth) ──────────────────────────────────────────── */
export const createReview = createAsyncThunk(
  "reviews/createReview",
  async ({ productId, rating, comment }, { rejectWithValue }) => {
    try {
      const token = getToken();
      if (!token) return rejectWithValue("Not authenticated");

      const res = await axios.post(
        `${BACKEND_URL}/api/reviews/${productId}`,
        { rating, comment },
        { headers: { token } }
      );
      if (res.data.success) return res.data.review;
      return rejectWithValue(res.data.message);
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

/* ── Update own review (auth) ────────────────────────────────────────── */
export const updateReview = createAsyncThunk(
  "reviews/updateReview",
  async ({ reviewId, rating, comment }, { rejectWithValue }) => {
    try {
      const token = getToken();
      if (!token) return rejectWithValue("Not authenticated");

      const res = await axios.put(
        `${BACKEND_URL}/api/reviews/${reviewId}`,
        { rating, comment },
        { headers: { token } }
      );
      if (res.data.success) return res.data.review;
      return rejectWithValue(res.data.message);
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

/* ── Delete own review (auth) ────────────────────────────────────────── */
export const deleteReview = createAsyncThunk(
  "reviews/deleteReview",
  async (reviewId, { rejectWithValue }) => {
    try {
      const token = getToken();
      if (!token) return rejectWithValue("Not authenticated");

      const res = await axios.delete(
        `${BACKEND_URL}/api/reviews/${reviewId}`,
        { headers: { token } }
      );
      if (res.data.success) return reviewId;
      return rejectWithValue(res.data.message);
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

/* ── Slice ────────────────────────────────────────────────────────────── */
const reviewSlice = createSlice({
  name: "reviews",
  initialState: {
    items: [],       // reviews for current product
    loading: false,
    submitting: false,
    error: null,
  },
  reducers: {
    clearReviews: (state) => {
      state.items = [];
      state.error = null;
    },
    clearReviewError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchProductReviews
      .addCase(fetchProductReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProductReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // createReview
      .addCase(createReview.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.submitting = false;
        state.items.unshift(action.payload);
      })
      .addCase(createReview.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      // updateReview
      .addCase(updateReview.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        state.submitting = false;
        const idx = state.items.findIndex(
          (r) => r._id === action.payload._id
        );
        if (idx >= 0) state.items[idx] = action.payload;
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      // deleteReview
      .addCase(deleteReview.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.submitting = false;
        state.items = state.items.filter((r) => r._id !== action.payload);
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      });
  },
});

export const { clearReviews, clearReviewError } = reviewSlice.actions;

// Selectors
export const selectReviews = (state) => state.reviews.items;
export const selectReviewsLoading = (state) => state.reviews.loading;
export const selectReviewSubmitting = (state) => state.reviews.submitting;
export const selectReviewError = (state) => state.reviews.error;

export default reviewSlice.reducer;
