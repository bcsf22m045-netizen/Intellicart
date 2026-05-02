import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setField,
  toggleSizes,
  addSize,
  removeSize,
  toggleColors,
  addColor,
  removeColor,
  updateStock,
  updateVariant,
  setImageFile,
  updateImageColor,
  removeImage,
  resetForm,
} from "../store/slices/productFormSlice";
import { assets } from "../assets/assets";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";

const Add = ({ token }) => {
  const dispatch = useDispatch();
  const form = useSelector((state) => state.productForm);

  // Categories from API
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Local inputs for adding new size / color
  const [newSize, setNewSize] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");

  // Track which variant rows are expanded for price/SKU override
  const [showVariantPricing, setShowVariantPricing] = useState(false);

  // Ref-based file map (actual File objects — not in Redux)
  const fileMapRef = useRef({});

  // ── Fetch categories on mount ──
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(backendUrl + "/api/category/list");
        if (res.data.success) setCategories(res.data.categories);
      } catch (e) {
        console.error(e);
      }
    };
    fetchCategories();
  }, []);

  // Selected category object
  const selectedCategory = categories.find((c) => c._id === form.category);

  // ── Handle image add ──
  const handleImageAdd = (e, color = "") => {
    const file = e.target.files[0];
    if (!file) return;
    const id = form.nextImageId;
    const preview = URL.createObjectURL(file);
    fileMapRef.current[id] = file;
    dispatch(setImageFile({ id, color, preview }));
    e.target.value = ""; // reset input
  };

  // ── Handle image remove ──
  const handleImageRemove = (id) => {
    const img = form.imageFiles.find((i) => i.id === id);
    if (img?.preview) URL.revokeObjectURL(img.preview);
    delete fileMapRef.current[id];
    dispatch(removeImage(id));
  };

  // ── Warnings ──
  const getStockWarnings = () => {
    const warnings = [];
    if (form.sizes.length > 0 && form.colors.length > 0) {
      const expected = form.sizes.length * form.colors.length;
      const filled = form.stock.filter((s) => s.quantity > 0).length;
      if (filled < expected) {
        warnings.push(
          `Stock mapping incomplete: ${filled}/${expected} size×color combinations have quantity > 0`
        );
      }
    }
    if (form.enableColors && form.colors.length > 0) {
      const colorsWithImages = new Set(
        form.imageFiles.filter((i) => i.color).map((i) => i.color)
      );
      const missing = form.colors.filter((c) => !colorsWithImages.has(c.name));
      if (missing.length > 0) {
        warnings.push(
          `Colors without images: ${missing.map((c) => c.name).join(", ")}`
        );
      }
    }
    return warnings;
  };

  // ── Submit ──
  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!form.name || !form.description || !form.category || !form.basePrice || !form.minPrice || !form.sku) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (Number(form.minPrice) > Number(form.basePrice)) {
      toast.error("Minimum price cannot be greater than base price");
      return;
    }

    if (form.imageFiles.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();

      // Basic fields
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("category", form.category);
      if (form.subCategory) formData.append("subCategory", form.subCategory);
      formData.append("basePrice", form.basePrice);
      formData.append("minPrice", form.minPrice);
      formData.append("sku", form.sku);
      formData.append("bestSeller", form.bestSeller);

      // Sizes, Colors, Stock, Variants
      formData.append("sizes", JSON.stringify(form.sizes));
      formData.append("colors", JSON.stringify(form.colors));
      formData.append("stock", JSON.stringify(form.stock));
      formData.append("variants", JSON.stringify(form.variants.filter(v => v.price || v.sku)));

      // Color → image file index mapping
      const colorImageMap = {};
      form.imageFiles.forEach((img, idx) => {
        if (img.color) {
          if (!colorImageMap[img.color]) colorImageMap[img.color] = [];
          colorImageMap[img.color].push(idx);
        }
      });
      formData.append("colorImageMap", JSON.stringify(colorImageMap));

      // Append image files
      form.imageFiles.forEach((img, idx) => {
        const file = fileMapRef.current[img.id];
        if (file) {
          formData.append(`image${idx}`, file);
        }
      });

      const response = await axios.post(
        backendUrl + "/api/product/add",
        formData,
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        // Clean up previews
        form.imageFiles.forEach((img) => {
          if (img.preview) URL.revokeObjectURL(img.preview);
        });
        fileMapRef.current = {};
        dispatch(resetForm());
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message);
    }

    setSubmitting(false);
  };

  const warnings = getStockWarnings();

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col w-full items-start gap-5 pb-10"
    >
      {/* ─────────────── CATEGORY & SUBCATEGORY ─────────────── */}
      <div className="flex flex-col sm:flex-row gap-4 w-full">
        <div className="flex-1 max-w-[250px]">
          <p className="mb-2 font-medium text-sm">
            Category <span className="text-red-500">*</span>
          </p>
          <select
            value={form.category}
            onChange={(e) => {
              dispatch(setField({ field: "category", value: e.target.value }));
              dispatch(setField({ field: "subCategory", value: "" }));
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {selectedCategory && selectedCategory.subcategories.length > 0 && (
          <div className="flex-1 max-w-[250px]">
            <p className="mb-2 font-medium text-sm">Sub Category</p>
            <select
              value={form.subCategory}
              onChange={(e) =>
                dispatch(
                  setField({ field: "subCategory", value: e.target.value })
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="">Select Subcategory</option>
              {selectedCategory.subcategories.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ─────────────── NAME & DESCRIPTION ─────────────── */}
      <div className="w-full">
        <p className="mb-2 font-medium text-sm">
          Product Name <span className="text-red-500">*</span>
        </p>
        <input
          className="w-full max-w-[500px] px-3 py-2 border border-gray-300 rounded"
          type="text"
          placeholder="Type here"
          required
          value={form.name}
          onChange={(e) =>
            dispatch(setField({ field: "name", value: e.target.value }))
          }
        />
      </div>

      <div className="w-full">
        <p className="mb-2 font-medium text-sm">
          Product Description <span className="text-red-500">*</span>
        </p>
        <textarea
          className="w-full max-w-[500px] px-3 py-2 border border-gray-300 rounded"
          placeholder="Write content here"
          required
          rows={3}
          value={form.description}
          onChange={(e) =>
            dispatch(setField({ field: "description", value: e.target.value }))
          }
        />
      </div>

      {/* ─────────────── SKU & PRICING ─────────────── */}
      <div className="flex flex-col sm:flex-row gap-4 w-full">
        <div>
          <p className="mb-2 font-medium text-sm">
            SKU <span className="text-red-500">*</span>
          </p>
          <input
            type="text"
            className="w-full px-3 py-2 sm:w-[180px] border border-gray-300 rounded"
            placeholder="e.g. PROD-001"
            required
            value={form.sku}
            onChange={(e) =>
              dispatch(setField({ field: "sku", value: e.target.value }))
            }
          />
        </div>

        <div>
          <p className="mb-2 font-medium text-sm">
            Base Price <span className="text-red-500">*</span>
          </p>
          <input
            type="number"
            min="0"
            step="0.01"
            className="w-full px-3 py-2 sm:w-[140px] border border-gray-300 rounded"
            placeholder="99.99"
            required
            value={form.basePrice}
            onChange={(e) =>
              dispatch(setField({ field: "basePrice", value: e.target.value }))
            }
          />
        </div>

        <div>
          <p className="mb-2 font-medium text-sm">
            Min Price <span className="text-red-500">*</span>
          </p>
          <input
            type="number"
            min="0"
            step="0.01"
            className="w-full px-3 py-2 sm:w-[140px] border border-gray-300 rounded"
            placeholder="49.99"
            required
            value={form.minPrice}
            onChange={(e) =>
              dispatch(setField({ field: "minPrice", value: e.target.value }))
            }
          />
        </div>
      </div>

      {/* ─────────────── SIZES (Optional) ─────────────── */}
      <div className="w-full border border-gray-200 rounded-lg p-4 bg-white">
        <div className="flex items-center gap-3 mb-3">
          <input
            type="checkbox"
            id="enableSizes"
            checked={form.enableSizes}
            onChange={() => dispatch(toggleSizes())}
          />
          <label htmlFor="enableSizes" className="font-medium text-sm cursor-pointer">
            Enable Sizes
          </label>
        </div>

        {form.enableSizes && (
          <div>
            {/* Add custom size */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                className="px-3 py-1.5 border border-gray-300 rounded text-sm w-[120px]"
                placeholder="e.g. S, M, 42"
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (newSize.trim()) {
                      dispatch(addSize(newSize));
                      setNewSize("");
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (newSize.trim()) {
                    dispatch(addSize(newSize));
                    setNewSize("");
                  }
                }}
                className="px-3 py-1.5 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
              >
                Add Size
              </button>
            </div>

            {/* Quick-add common sizes */}
            <div className="flex gap-2 mb-3 flex-wrap">
              {["S", "M", "L", "XL", "XXL"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    if (!form.sizes.includes(s)) dispatch(addSize(s));
                    else dispatch(removeSize(s));
                  }}
                  className={`px-3 py-1 text-sm rounded border ${
                    form.sizes.includes(s)
                      ? "bg-pink-100 border-pink-300"
                      : "bg-slate-100 border-gray-300"
                  } cursor-pointer`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Size tags */}
            {form.sizes.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {form.sizes.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => dispatch(removeSize(s))}
                      className="text-red-400 hover:text-red-600 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─────────────── COLORS (Optional) ─────────────── */}
      <div className="w-full border border-gray-200 rounded-lg p-4 bg-white">
        <div className="flex items-center gap-3 mb-3">
          <input
            type="checkbox"
            id="enableColors"
            checked={form.enableColors}
            onChange={() => dispatch(toggleColors())}
          />
          <label htmlFor="enableColors" className="font-medium text-sm cursor-pointer">
            Enable Colors
          </label>
        </div>

        {form.enableColors && (
          <div>
            {/* Color picker + name input */}
            <div className="flex gap-2 mb-3 items-end flex-wrap">
              <div>
                <p className="text-xs text-gray-500 mb-1">Pick Color</p>
                <input
                  type="color"
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer p-0.5"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Color Name</p>
                <input
                  type="text"
                  className="px-3 py-2 border border-gray-300 rounded text-sm w-[160px]"
                  placeholder="e.g. Sky Blue"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (newColor.trim()) {
                        dispatch(addColor({ name: newColor, hex: newColorHex }));
                        setNewColor("");
                        setNewColorHex("#000000");
                      }
                    }
                  }}
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Hex</p>
                <input
                  type="text"
                  className="px-3 py-2 border border-gray-300 rounded text-sm w-[100px] font-mono"
                  value={newColorHex}
                  onChange={(e) => {
                    let v = e.target.value;
                    if (!v.startsWith("#")) v = "#" + v;
                    setNewColorHex(v);
                  }}
                  placeholder="#000000"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (newColor.trim()) {
                    dispatch(addColor({ name: newColor, hex: newColorHex }));
                    setNewColor("");
                    setNewColorHex("#000000");
                  }
                }}
                className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
              >
                Add Color
              </button>
            </div>

            {/* Color tags with swatches */}
            {form.colors.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {form.colors.map((c) => (
                  <span
                    key={c.name}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm shadow-sm"
                  >
                    <span
                      className="w-5 h-5 rounded-full border border-gray-300 flex-shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="font-medium">{c.name}</span>
                    <span className="text-xs text-gray-400 font-mono">{c.hex}</span>
                    <button
                      type="button"
                      onClick={() => dispatch(removeColor(c.name))}
                      className="text-red-400 hover:text-red-600 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─────────────── IMAGES ─────────────── */}
      <div className="w-full border border-gray-200 rounded-lg p-4 bg-white">
        <p className="mb-3 font-medium text-sm">
          Product Images <span className="text-red-500">*</span>
        </p>

        {/* If colors enabled, show per-color upload sections */}
        {form.enableColors && form.colors.length > 0 ? (
          <div className="space-y-4">
            {/* General images (no color) */}
            <div>
              <p className="text-xs text-gray-500 mb-2">
                General Images (no color)
              </p>
              <div className="flex gap-2 flex-wrap items-center">
                {form.imageFiles
                  .filter((img) => !img.color)
                  .map((img) => (
                    <div key={img.id} className="relative">
                      <img
                        src={img.preview}
                        className="w-20 h-20 object-cover rounded border"
                        alt=""
                      />
                      <button
                        type="button"
                        onClick={() => handleImageRemove(img.id)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                <label className="cursor-pointer">
                  <img src={assets.upload_area} className="w-20" alt="Upload" />
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => handleImageAdd(e, "")}
                  />
                </label>
              </div>
            </div>

            {/* Per-color images */}
            {form.colors.map((color) => (
              <div key={color.name}>
                <p className="text-xs font-medium mb-2 px-2 py-1 bg-blue-50 rounded inline-flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border border-gray-300 inline-block"
                    style={{ backgroundColor: color.hex }}
                  />
                  {color.name}
                </p>
                <div className="flex gap-2 flex-wrap items-center mt-1">
                  {form.imageFiles
                    .filter((img) => img.color === color.name)
                    .map((img) => (
                      <div key={img.id} className="relative">
                        <img
                          src={img.preview}
                          className="w-20 h-20 object-cover rounded border border-blue-300"
                          alt=""
                        />
                        <button
                          type="button"
                          onClick={() => handleImageRemove(img.id)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  <label className="cursor-pointer">
                    <img
                      src={assets.upload_area}
                      className="w-20"
                      alt="Upload"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => handleImageAdd(e, color.name)}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Simple image upload (no colors) */
          <div className="flex gap-2 flex-wrap items-center">
            {form.imageFiles.map((img) => (
              <div key={img.id} className="relative">
                <img
                  src={img.preview}
                  className="w-20 h-20 object-cover rounded border"
                  alt=""
                />
                <button
                  type="button"
                  onClick={() => handleImageRemove(img.id)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
            <label className="cursor-pointer">
              <img src={assets.upload_area} className="w-20" alt="Upload" />
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => handleImageAdd(e, "")}
              />
            </label>
          </div>
        )}
      </div>

      {/* ─────────────── STOCK MATRIX ─────────────── */}
      {(form.sizes.length > 0 || form.colors.length > 0) && (
        <div className="w-full border border-gray-200 rounded-lg p-4 bg-white">
          <p className="mb-3 font-medium text-sm">Stock Quantity</p>

          {/* Multi-size × multi-color matrix */}
          {form.sizes.length > 0 && form.colors.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="px-3 py-2 border border-gray-200 bg-gray-50 text-left">
                      Size \ Color
                    </th>
                    {form.colors.map((c) => (
                      <th
                        key={c.name}
                        className="px-3 py-2 border border-gray-200 bg-gray-50"
                      >
                        <span className="inline-flex items-center gap-1">
                          <span
                            className="w-3 h-3 rounded-full border border-gray-300 inline-block"
                            style={{ backgroundColor: c.hex }}
                          />
                          {c.name}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {form.sizes.map((s) => (
                    <tr key={s}>
                      <td className="px-3 py-2 border border-gray-200 font-medium bg-gray-50">
                        {s}
                      </td>
                      {form.colors.map((c) => {
                        const entry = form.stock.find(
                          (st) => st.size === s && st.color === c.name
                        );
                        return (
                          <td
                            key={c.name}
                            className="px-1 py-1 border border-gray-200"
                          >
                            <input
                              type="number"
                              min="0"
                              className="w-[70px] px-2 py-1 border border-gray-300 rounded text-center text-sm"
                              value={entry?.quantity ?? 0}
                              onChange={(e) =>
                                dispatch(
                                  updateStock({
                                    size: s,
                                    color: c.name,
                                    quantity: e.target.value,
                                  })
                                )
                              }
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : form.sizes.length > 0 ? (
            /* Sizes only */
            <div className="space-y-2">
              {form.sizes.map((s) => {
                const entry = form.stock.find(
                  (st) => st.size === s && st.color === ""
                );
                return (
                  <div key={s} className="flex items-center gap-3">
                    <span className="text-sm w-[60px] font-medium">{s}</span>
                    <input
                      type="number"
                      min="0"
                      className="w-[100px] px-2 py-1 border border-gray-300 rounded text-sm"
                      value={entry?.quantity ?? 0}
                      onChange={(e) =>
                        dispatch(
                          updateStock({
                            size: s,
                            color: "",
                            quantity: e.target.value,
                          })
                        )
                      }
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            /* Colors only */
            <div className="space-y-2">
              {form.colors.map((c) => {
                const entry = form.stock.find(
                  (st) => st.size === "" && st.color === c.name
                );
                return (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 text-sm w-[100px] font-medium">
                      <span
                        className="w-4 h-4 rounded-full border border-gray-300 inline-block flex-shrink-0"
                        style={{ backgroundColor: c.hex }}
                      />
                      {c.name}
                    </span>
                    <input
                      type="number"
                      min="0"
                      className="w-[100px] px-2 py-1 border border-gray-300 rounded text-sm"
                      value={entry?.quantity ?? 0}
                      onChange={(e) =>
                        dispatch(
                          updateStock({
                            size: "",
                            color: c.name,
                            quantity: e.target.value,
                          })
                        )
                      }
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────── VARIANT PRICING (Optional) ─────────────── */}
      {(form.sizes.length > 0 || form.colors.length > 0) && (
        <div className="w-full border border-gray-200 rounded-lg p-4 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <input
              type="checkbox"
              id="showVariantPricing"
              checked={showVariantPricing}
              onChange={() => setShowVariantPricing(!showVariantPricing)}
            />
            <label htmlFor="showVariantPricing" className="font-medium text-sm cursor-pointer">
              Set Per-Variant Price &amp; SKU (Optional)
            </label>
          </div>

          {showVariantPricing && (
            <div className="overflow-x-auto">
              <table className="text-sm border-collapse w-full max-w-[600px]">
                <thead>
                  <tr>
                    {form.sizes.length > 0 && (
                      <th className="px-3 py-2 border border-gray-200 bg-gray-50 text-left">
                        Size
                      </th>
                    )}
                    {form.colors.length > 0 && (
                      <th className="px-3 py-2 border border-gray-200 bg-gray-50 text-left">
                        Color
                      </th>
                    )}
                    <th className="px-3 py-2 border border-gray-200 bg-gray-50 text-left">
                      Price
                    </th>
                    <th className="px-3 py-2 border border-gray-200 bg-gray-50 text-left">
                      SKU
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const rows = [];
                    const sArr = form.sizes.length > 0 ? form.sizes : [""];
                    const cArr =
                      form.colors.length > 0
                        ? form.colors.map((c) => c.name)
                        : [""];
                    for (const s of sArr) {
                      for (const c of cArr) {
                        const variant = form.variants.find(
                          (v) => v.size === s && v.color === c
                        );
                        const colorObj = form.colors.find(
                          (co) => co.name === c
                        );
                        rows.push(
                          <tr key={`${s}-${c}`}>
                            {form.sizes.length > 0 && (
                              <td className="px-3 py-1 border border-gray-200">
                                {s}
                              </td>
                            )}
                            {form.colors.length > 0 && (
                              <td className="px-3 py-1 border border-gray-200">
                                <span className="inline-flex items-center gap-1">
                                  {colorObj && (
                                    <span
                                      className="w-3 h-3 rounded-full border border-gray-300 inline-block"
                                      style={{
                                        backgroundColor: colorObj.hex,
                                      }}
                                    />
                                  )}
                                  {c}
                                </span>
                              </td>
                            )}
                            <td className="px-1 py-1 border border-gray-200">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder={form.basePrice || "—"}
                                className="w-[100px] px-2 py-1 border border-gray-300 rounded text-sm"
                                value={variant?.price ?? ""}
                                onChange={(e) =>
                                  dispatch(
                                    updateVariant({
                                      size: s,
                                      color: c,
                                      price: e.target.value,
                                    })
                                  )
                                }
                              />
                            </td>
                            <td className="px-1 py-1 border border-gray-200">
                              <input
                                type="text"
                                placeholder={
                                  form.sku
                                    ? `${form.sku}-${s || ""}${s && c ? "-" : ""}${c || ""}`
                                    : "Auto"
                                }
                                className="w-[150px] px-2 py-1 border border-gray-300 rounded text-sm"
                                value={variant?.sku ?? ""}
                                onChange={(e) =>
                                  dispatch(
                                    updateVariant({
                                      size: s,
                                      color: c,
                                      sku: e.target.value,
                                    })
                                  )
                                }
                              />
                            </td>
                          </tr>
                        );
                      }
                    }
                    return rows;
                  })()}
                </tbody>
              </table>
              <p className="text-xs text-gray-400 mt-2">
                Leave empty to use base price and auto-generated SKU
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─────────────── BESTSELLER ─────────────── */}
      <div className="flex gap-2 items-center">
        <input
          type="checkbox"
          id="bestseller"
          checked={form.bestSeller}
          onChange={() =>
            dispatch(setField({ field: "bestSeller", value: !form.bestSeller }))
          }
        />
        <label className="cursor-pointer text-sm" htmlFor="bestseller">
          Add to Best Seller
        </label>
      </div>

      {/* ─────────────── WARNINGS ─────────────── */}
      {warnings.length > 0 && (
        <div className="w-full max-w-[500px] bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm font-medium text-amber-800 mb-1">⚠ Warnings</p>
          {warnings.map((w, i) => (
            <p key={i} className="text-xs text-amber-700">
              • {w}
            </p>
          ))}
        </div>
      )}

      {/* ─────────────── SUBMIT ─────────────── */}
      <button
        className="px-8 py-3 mt-2 bg-black text-white rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
        type="submit"
        disabled={submitting}
      >
        {submitting ? "Adding..." : "Add Product"}
      </button>
    </form>
  );
};

export default Add;
