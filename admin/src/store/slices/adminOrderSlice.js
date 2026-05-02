import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

/* ── Fetch all orders (admin) ────────────────────────────────────────── */
export const fetchAdminOrders = createAsyncThunk(
  "adminOrders/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return rejectWithValue("Not authenticated");

      const res = await axios.get(`${BACKEND_URL}/api/order/admin/all`, {
        headers: { token },
      });
      if (res.data.success) return res.data.orders;
      return rejectWithValue(res.data.message);
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

/* ── Update order status (admin) ─────────────────────────────────────── */
export const updateOrderStatus = createAsyncThunk(
  "adminOrders/updateStatus",
  async ({ orderId, status }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return rejectWithValue("Not authenticated");

      const res = await axios.put(
        `${BACKEND_URL}/api/order/admin/${orderId}/status`,
        { status },
        { headers: { token } }
      );
      if (res.data.success) return res.data.order;
      return rejectWithValue(res.data.message);
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

/* ── Slice ────────────────────────────────────────────────────────────── */
const adminOrderSlice = createSlice({
  name: "adminOrders",
  initialState: {
    orders: [],
    loading: false,
    updating: null, // orderId being updated
    error: null,
  },
  reducers: {
    clearAdminOrderError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAll
      .addCase(fetchAdminOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchAdminOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // updateStatus
      .addCase(updateOrderStatus.pending, (state, action) => {
        state.updating = action.meta.arg.orderId;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.updating = null;
        const updated = action.payload;
        const idx = state.orders.findIndex((o) => o._id === updated._id);
        if (idx >= 0) {
          state.orders[idx] = updated;
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.updating = null;
        state.error = action.payload;
      });
  },
});

export const { clearAdminOrderError } = adminOrderSlice.actions;

export const selectAdminOrders = (state) => state.adminOrders.orders;
export const selectAdminOrdersLoading = (state) => state.adminOrders.loading;
export const selectAdminOrderUpdating = (state) => state.adminOrders.updating;
export const selectAdminOrderError = (state) => state.adminOrders.error;

export default adminOrderSlice.reducer;
