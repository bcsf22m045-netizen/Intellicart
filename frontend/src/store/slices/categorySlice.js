import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchCategories = createAsyncThunk(
  "categories/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${backendUrl}/api/category/list`);
      if (res.data.success) return res.data.categories;
      return rejectWithValue(res.data.message);
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const categorySlice = createSlice({
  name: "categories",
  initialState: {
    items: [],       // array of { _id, name, description, image, subcategories: [{_id, name, image}] }
    loading: false,
    error: null,
    fetched: false,  // track if we've fetched at least once
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.fetched = true;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Selectors
export const selectCategories = (state) => state.categories.items;
export const selectCategoriesLoading = (state) => state.categories.loading;
export const selectCategoriesFetched = (state) => state.categories.fetched;

export default categorySlice.reducer;
