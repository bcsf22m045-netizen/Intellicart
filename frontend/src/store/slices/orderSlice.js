import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const getToken = () =>
  localStorage.getItem("accessToken") || localStorage.getItem("token");

/* ── Place order ──────────────────────────────────────────────────────── */
export const placeOrder = createAsyncThunk(
  "orders/placeOrder",
  async ({ items, shippingAddress }, { rejectWithValue }) => {
    try {
      const token = getToken();
      if (!token) return rejectWithValue("Not authenticated");

      const res = await axios.post(
        `${BACKEND_URL}/api/order/place`,
        { items, shippingAddress },
        { headers: { token } }
      );
      if (res.data.success) return res.data.order;
      return rejectWithValue(res.data.message);
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

/* ── Get user orders ──────────────────────────────────────────────────── */
export const fetchMyOrders = createAsyncThunk(
  "orders/fetchMyOrders",
  async (_, { rejectWithValue }) => {
    try {
      const token = getToken();
      if (!token) return rejectWithValue("Not authenticated");

      const res = await axios.get(`${BACKEND_URL}/api/order/my`, {
        headers: { token },
      });
      if (res.data.success) return res.data.orders;
      return rejectWithValue(res.data.message);
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

/* ── Slice ────────────────────────────────────────────────────────────── */
const orderSlice = createSlice({
  name: "orders",
  initialState: {
    myOrders: [],
    currentOrder: null, // last placed order
    loading: false,
    placing: false,
    error: null,
  },
  reducers: {
    clearOrderError: (state) => {
      state.error = null;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    resetOrders: (state) => {
      state.myOrders = [];
      state.currentOrder = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // placeOrder
      .addCase(placeOrder.pending, (state) => {
        state.placing = true;
        state.error = null;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.placing = false;
        state.currentOrder = action.payload;
        // Prepend to myOrders
        state.myOrders.unshift(action.payload);
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.placing = false;
        state.error = action.payload;
      })
      // fetchMyOrders
      .addCase(fetchMyOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.myOrders = action.payload;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearOrderError, clearCurrentOrder, resetOrders } =
  orderSlice.actions;

export const selectMyOrders = (state) => state.orders.myOrders;
export const selectCurrentOrder = (state) => state.orders.currentOrder;
export const selectOrderPlacing = (state) => state.orders.placing;
export const selectOrderLoading = (state) => state.orders.loading;
export const selectOrderError = (state) => state.orders.error;

export default orderSlice.reducer;
