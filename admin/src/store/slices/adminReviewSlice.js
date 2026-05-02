import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { backendUrl } from "../../App";

const getToken = () => localStorage.getItem("token") || "";

/* ── Fetch all reviews (admin) ───────────────────────────────────────── */
export const fetchAdminReviews = createAsyncThunk(
  "adminReviews/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await axios.get(`${backendUrl}/api/reviews/admin/all`, {
        headers: { token },
      });
      if (res.data.success) return res.data.reviews;
      return rejectWithValue(res.data.message);
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

/* ── Admin delete a review ───────────────────────────────────────────── */
export const adminDeleteReview = createAsyncThunk(
  "adminReviews/delete",
  async (reviewId, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await axios.delete(
        `${backendUrl}/api/reviews/admin/${reviewId}`,
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
const adminReviewSlice = createSlice({
  name: "adminReviews",
  initialState: {
    reviews: [],
    loading: false,
    deleting: null, // reviewId being deleted
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchAdminReviews
      .addCase(fetchAdminReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload;
      })
      .addCase(fetchAdminReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // adminDeleteReview
      .addCase(adminDeleteReview.pending, (state, action) => {
        state.deleting = action.meta.arg;
        state.error = null;
      })
      .addCase(adminDeleteReview.fulfilled, (state, action) => {
        state.deleting = null;
        state.reviews = state.reviews.filter((r) => r._id !== action.payload);
      })
      .addCase(adminDeleteReview.rejected, (state, action) => {
        state.deleting = null;
        state.error = action.payload;
      });
  },
});

// Selectors
export const selectAdminReviews = (state) => state.adminReviews.reviews;
export const selectAdminReviewsLoading = (state) => state.adminReviews.loading;
export const selectAdminReviewDeleting = (state) => state.adminReviews.deleting;

export default adminReviewSlice.reducer;
