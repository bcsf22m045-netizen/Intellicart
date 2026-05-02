import { createSlice } from "@reduxjs/toolkit";

/* ─── Initial State ──────────────────────────────────────────────────────── */
const initialState = {
  // Basic info
  name: "",
  description: "",
  category: "",
  subCategory: "",
  sku: "",
  bestSeller: false,

  // Pricing
  basePrice: "",
  minPrice: "",

  // Sizes & Colors — optional
  enableSizes: false,
  enableColors: false,
  sizes: [], // ["S", "M", "L"]
  colors: [], // [{ name: "Sky Blue", hex: "#87CEEB" }]

  // Stock mapping: array of { size, color, quantity }
  stock: [],

  // Variant pricing overrides: array of { size, color, price, sku }
  variants: [],

  // Images — each entry: { id, color, file: null, preview: "" }
  // `file` is the File object (for upload), `preview` is a blob URL for display
  imageFiles: [],
  nextImageId: 0,
};

/* ─── Slice ──────────────────────────────────────────────────────────────── */
const productFormSlice = createSlice({
  name: "productForm",
  initialState,
  reducers: {
    // ── Basic fields ──
    setField(state, action) {
      const { field, value } = action.payload;
      state[field] = value;
    },

    // ── Sizes ──
    toggleSizes(state) {
      state.enableSizes = !state.enableSizes;
      if (!state.enableSizes) {
        state.sizes = [];
        state.stock = state.stock.filter((s) => !s.size);
        state.variants = state.variants.filter((v) => !v.size);
      }
    },
    addSize(state, action) {
      const size = action.payload.trim();
      if (size && !state.sizes.includes(size)) {
        state.sizes.push(size);
        // Auto-generate stock entries for new size
        if (state.colors.length > 0) {
          for (const color of state.colors) {
            state.stock.push({ size, color: color.name, quantity: 0 });
          }
        } else {
          state.stock.push({ size, color: "", quantity: 0 });
        }
      }
    },
    removeSize(state, action) {
      const size = action.payload;
      state.sizes = state.sizes.filter((s) => s !== size);
      state.stock = state.stock.filter((s) => s.size !== size);
      state.variants = state.variants.filter((v) => v.size !== size);
    },

    // ── Colors ──
    toggleColors(state) {
      state.enableColors = !state.enableColors;
      if (!state.enableColors) {
        state.colors = [];
        state.stock = state.stock.filter((s) => !s.color);
        state.variants = state.variants.filter((v) => !v.color);
        // Reset color on all images
        state.imageFiles = state.imageFiles.map((img) => ({
          ...img,
          color: "",
        }));
      }
    },
    addColor(state, action) {
      // payload: { name: "Sky Blue", hex: "#87CEEB" }
      const { name, hex } = action.payload;
      const trimmedName = name.trim();
      if (
        trimmedName &&
        !state.colors.some(
          (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
        )
      ) {
        state.colors.push({ name: trimmedName, hex: hex || "#000000" });
        // Auto-generate stock entries for new color
        if (state.sizes.length > 0) {
          for (const size of state.sizes) {
            state.stock.push({ size, color: trimmedName, quantity: 0 });
          }
        } else {
          state.stock.push({ size: "", color: trimmedName, quantity: 0 });
        }
      }
    },
    removeColor(state, action) {
      // payload: color name string
      const colorName = action.payload;
      state.colors = state.colors.filter((c) => c.name !== colorName);
      state.stock = state.stock.filter((s) => s.color !== colorName);
      state.variants = state.variants.filter((v) => v.color !== colorName);
      // Remove color mapping from images
      state.imageFiles = state.imageFiles.map((img) =>
        img.color === colorName ? { ...img, color: "" } : img
      );
    },

    // ── Stock ──
    updateStock(state, action) {
      const { size, color, quantity } = action.payload;
      const entry = state.stock.find(
        (s) => s.size === size && s.color === color
      );
      if (entry) {
        entry.quantity = Number(quantity) || 0;
      } else {
        state.stock.push({ size, color, quantity: Number(quantity) || 0 });
      }
    },

    // ── Variant price/SKU overrides ──
    updateVariant(state, action) {
      const { size, color, price, sku } = action.payload;
      const idx = state.variants.findIndex(
        (v) => v.size === (size || "") && v.color === (color || "")
      );
      if (idx >= 0) {
        if (price !== undefined) state.variants[idx].price = price;
        if (sku !== undefined) state.variants[idx].sku = sku;
      } else {
        state.variants.push({
          size: size || "",
          color: color || "",
          price: price || "",
          sku: sku || "",
        });
      }
    },
    removeVariant(state, action) {
      const { size, color } = action.payload;
      state.variants = state.variants.filter(
        (v) => !(v.size === (size || "") && v.color === (color || ""))
      );
    },

    // ── Images ──
    // `file` is NOT stored directly in Redux to avoid serialization issues,
    // we store an ID and the component holds the actual File in a ref/map
    setImageFile(state, action) {
      const { id, color, preview } = action.payload;
      state.imageFiles.push({ id, color: color || "", preview });
      state.nextImageId = id + 1;
    },
    updateImageColor(state, action) {
      const { id, color } = action.payload;
      const img = state.imageFiles.find((i) => i.id === id);
      if (img) img.color = color;
    },
    removeImage(state, action) {
      const id = action.payload;
      state.imageFiles = state.imageFiles.filter((i) => i.id !== id);
    },

    // ── Reset ──
    resetForm() {
      return { ...initialState };
    },

    // ── Load existing product for editing ──
    loadProduct(state, action) {
      const p = action.payload;
      state.name = p.name || "";
      state.description = p.description || "";
      state.category = p.category || "";
      state.subCategory = p.subCategory || "";
      state.sku = p.sku || "";
      state.bestSeller = !!p.bestSeller;
      state.basePrice = p.basePrice ?? "";
      state.minPrice = p.minPrice ?? "";

      state.sizes = p.sizes || [];
      state.enableSizes = state.sizes.length > 0;

      state.colors = (p.colors || []).map((c) =>
        typeof c === "object" ? c : { name: c, hex: "#000000" }
      );
      state.enableColors = state.colors.length > 0;

      state.stock = p.stock || [];
      state.variants = p.variants || [];

      // Load existing images as preview-only entries (no File object)
      state.imageFiles = (p.images || []).map((img, i) => ({
        id: i,
        color: img.color || "",
        preview: img.url || "",
        existingUrl: img.url || "", // flag that this is a server image
      }));
      state.nextImageId = (p.images || []).length;
    },
  },
});

export const {
  setField,
  toggleSizes,
  addSize,
  removeSize,
  toggleColors,
  addColor,
  removeColor,
  updateStock,
  updateVariant,
  removeVariant,
  setImageFile,
  updateImageColor,
  removeImage,
  resetForm,
  loadProduct,
} = productFormSlice.actions;

export default productFormSlice.reducer;
