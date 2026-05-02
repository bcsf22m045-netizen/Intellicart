import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const GUEST_CART_KEY = "intellicart_guest_cart";

/* ── Helper: get auth token ──────────────────────────────────────────── */
const getToken = () =>
  localStorage.getItem("accessToken") || localStorage.getItem("token");

/* ── Helper: localStorage guest cart ─────────────────────────────────── */
const loadGuestCart = () => {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveGuestCart = (cart) => {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
};

export const clearGuestCart = () => {
  localStorage.removeItem(GUEST_CART_KEY);
};

/* ── Async thunks ────────────────────────────────────────────────────── */

/** Fetch cart from server (authenticated users) */
export const fetchCart = createAsyncThunk(
  "cart/fetchCart",
  async (_, { rejectWithValue }) => {
    try {
      const token = getToken();
      if (!token) return rejectWithValue("Not authenticated");
      const res = await axios.get(`${BACKEND_URL}/api/cart`, {
        headers: { token },
      });
      if (res.data.success) return res.data.cartData;
      return rejectWithValue(res.data.message);
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

/** Add item to cart (server or local) */
export const addToCartAsync = createAsyncThunk(
  "cart/addToCart",
  async ({ productId, size, color, quantity, productData }, { getState, rejectWithValue }) => {
    try {
      const token = getToken();
      const { auth } = getState();

      if (token && auth.isAuthenticated) {
        const res = await axios.post(
          `${BACKEND_URL}/api/cart/add`,
          { productId, size, color, quantity },
          { headers: { token } }
        );
        if (res.data.success) return { source: "server", cartData: res.data.cartData };
        return rejectWithValue(res.data.message);
      }

      // Guest: add to local
      return {
        source: "local",
        item: { productId, size, color, quantity: quantity || 1, productData },
      };
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

/** Update cart item quantity (server or local) */
export const updateCartAsync = createAsyncThunk(
  "cart/updateCart",
  async ({ productId, size, color, quantity }, { getState, rejectWithValue }) => {
    try {
      const token = getToken();
      const { auth } = getState();

      if (token && auth.isAuthenticated) {
        const res = await axios.put(
          `${BACKEND_URL}/api/cart/update`,
          { productId, size, color, quantity },
          { headers: { token } }
        );
        if (res.data.success) return { source: "server", cartData: res.data.cartData };
        return rejectWithValue(res.data.message);
      }

      return { source: "local", productId, size, color, quantity };
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

/** Remove item from cart (server or local) */
export const removeFromCartAsync = createAsyncThunk(
  "cart/removeFromCart",
  async ({ productId, size, color }, { getState, rejectWithValue }) => {
    try {
      const token = getToken();
      const { auth } = getState();

      if (token && auth.isAuthenticated) {
        const res = await axios.delete(`${BACKEND_URL}/api/cart/remove`, {
          headers: { token },
          data: { productId, size, color },
        });
        if (res.data.success) return { source: "server", cartData: res.data.cartData };
        return rejectWithValue(res.data.message);
      }

      return { source: "local", productId, size, color };
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

/** Clear entire cart */
export const clearCartAsync = createAsyncThunk(
  "cart/clearCart",
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getToken();
      const { auth } = getState();

      if (token && auth.isAuthenticated) {
        const res = await axios.delete(`${BACKEND_URL}/api/cart/clear`, {
          headers: { token },
        });
        if (res.data.success) return { source: "server" };
        return rejectWithValue(res.data.message);
      }

      return { source: "local" };
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

/** Merge guest cart into server cart after login */
export const mergeGuestCart = createAsyncThunk(
  "cart/mergeGuest",
  async (_, { rejectWithValue }) => {
    try {
      const token = getToken();
      if (!token) return rejectWithValue("Not authenticated");

      const guestCart = loadGuestCart();
      if (guestCart.length === 0) {
        // Nothing to merge, just fetch server cart
        const res = await axios.get(`${BACKEND_URL}/api/cart`, {
          headers: { token },
        });
        if (res.data.success) return res.data.cartData;
        return rejectWithValue(res.data.message);
      }

      // Merge guest cart items into server
      const res = await axios.post(
        `${BACKEND_URL}/api/cart/merge`,
        { guestCart },
        { headers: { token } }
      );

      if (res.data.success) {
        clearGuestCart();
        // Re-fetch with stock info
        const fetchRes = await axios.get(`${BACKEND_URL}/api/cart`, {
          headers: { token },
        });
        if (fetchRes.data.success) return fetchRes.data.cartData;
        return res.data.cartData;
      }
      return rejectWithValue(res.data.message);
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

/* ── Slice ────────────────────────────────────────────────────────────── */
const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: loadGuestCart(), // Initialize from localStorage for guests
    loading: false,
    error: null,
  },
  reducers: {
    /** Load guest cart from localStorage */
    loadGuestCartState: (state) => {
      state.items = loadGuestCart();
    },
    /** Reset cart to empty (on logout) */
    resetCart: (state) => {
      state.items = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── fetchCart ──
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── addToCart ──
      .addCase(addToCartAsync.pending, (state) => {
        state.error = null;
      })
      .addCase(addToCartAsync.fulfilled, (state, action) => {
        if (action.payload.source === "server") {
          state.items = action.payload.cartData;
        } else {
          // Guest: update local array
          const { item } = action.payload;
          const existingIdx = state.items.findIndex(
            (i) =>
              i.productId === item.productId &&
              (i.size || "") === (item.size || "") &&
              (i.color || "") === (item.color || "")
          );
          if (existingIdx >= 0) {
            state.items[existingIdx].quantity += item.quantity;
          } else {
            state.items.push({
              productId: item.productId,
              name: item.productData?.name || "",
              image: item.productData?.image || "",
              price: item.productData?.price || 0,
              size: item.size || "",
              color: item.color || "",
              quantity: item.quantity,
            });
          }
          saveGuestCart(state.items);
        }
      })
      .addCase(addToCartAsync.rejected, (state, action) => {
        state.error = action.payload;
      })

      // ── updateCart ──
      .addCase(updateCartAsync.fulfilled, (state, action) => {
        if (action.payload.source === "server") {
          state.items = action.payload.cartData;
        } else {
          const { productId, size, color, quantity } = action.payload;
          const idx = state.items.findIndex(
            (i) =>
              i.productId === productId &&
              (i.size || "") === (size || "") &&
              (i.color || "") === (color || "")
          );
          if (idx >= 0) {
            if (quantity <= 0) {
              state.items.splice(idx, 1);
            } else {
              state.items[idx].quantity = quantity;
            }
          }
          saveGuestCart(state.items);
        }
      })
      .addCase(updateCartAsync.rejected, (state, action) => {
        state.error = action.payload;
      })

      // ── removeFromCart ──
      .addCase(removeFromCartAsync.fulfilled, (state, action) => {
        if (action.payload.source === "server") {
          state.items = action.payload.cartData;
        } else {
          const { productId, size, color } = action.payload;
          state.items = state.items.filter(
            (i) =>
              !(
                i.productId === productId &&
                (i.size || "") === (size || "") &&
                (i.color || "") === (color || "")
              )
          );
          saveGuestCart(state.items);
        }
      })
      .addCase(removeFromCartAsync.rejected, (state, action) => {
        state.error = action.payload;
      })

      // ── clearCart ──
      .addCase(clearCartAsync.fulfilled, (state) => {
        state.items = [];
        clearGuestCart();
      })

      // ── mergeGuestCart ──
      .addCase(mergeGuestCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(mergeGuestCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(mergeGuestCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { loadGuestCartState, resetCart } = cartSlice.actions;

/* ── Selectors ────────────────────────────────────────────────────────── */
export const selectCartItems = (state) => state.cart.items;
export const selectCartLoading = (state) => state.cart.loading;
export const selectCartError = (state) => state.cart.error;
export const selectCartCount = (state) =>
  state.cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
export const selectCartSubtotal = (state) =>
  state.cart.items.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
    0
  );

export default cartSlice.reducer;
