import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
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
  loadProduct,
} from "../store/slices/productFormSlice";
import {
  fetchSingleProduct,
  selectCurrentProduct,
  selectProductsLoading,
  clearCurrentProduct,
} from "../store/slices/productSlice";
import axios from "axios";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";

const Edit = ({ token }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const form = useSelector((state) => state.productForm);
  const currentProduct = useSelector(selectCurrentProduct);
  const productLoading = useSelector(selectProductsLoading);

  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Local inputs for adding new size / color
  const [newSize, setNewSize] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");
  const [showVariantPricing, setShowVariantPricing] = useState(false);

  // Ref-based file map (actual File objects — not in Redux)
  const fileMapRef = useRef({});

  // ── Fetch categories & product on mount ──
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
    dispatch(fetchSingleProduct(id));

    return () => {
      dispatch(clearCurrentProduct());
      dispatch(resetForm());
    };
  }, [id, dispatch]);

  // ── Load product data into form ──
  useEffect(() => {
    if (currentProduct && !loaded) {
      dispatch(loadProduct(currentProduct));
      // If product has variants, show the section
      if (currentProduct.variants && currentProduct.variants.length > 0) {
        setShowVariantPricing(true);
      }
      setLoaded(true);
    }
  }, [currentProduct, loaded, dispatch]);

  const selectedCategory = categories.find((c) => c._id === form.category);

  // ── Handle image add ──
  const handleImageAdd = (e, color = "") => {
    const file = e.target.files[0];
    if (!file) return;
    const id = form.nextImageId;
    const preview = URL.createObjectURL(file);
    fileMapRef.current[id] = file;
    dispatch(setImageFile({ id, color, preview }));
    e.target.value = "";
  };

  // ── Stock warnings ──
  const getStockWarnings = () => {
    const warnings = [];
    if (form.enableSizes && form.enableColors) {
      const expected = form.sizes.length * form.colors.length;
      if (form.stock.length < expected) {
        warnings.push(
          `Stock matrix incomplete: ${form.stock.length}/${expected} entries`
        );
      }
    }
    const zeroStock = form.stock.filter((s) => s.quantity === 0);
    if (zeroStock.length > 0 && form.stock.length > 0) {
      warnings.push(
        `${zeroStock.length} stock ${zeroStock.length === 1 ? "entry has" : "entries have"} zero quantity`
      );
    }
    return warnings;
  };

  // ── Submit (Update) ──
  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (
      !form.name ||
      !form.description ||
      !form.category ||
      !form.basePrice ||
      !form.minPrice ||
      !form.sku
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (Number(form.minPrice) > Number(form.basePrice)) {
      toast.error("Minimum price cannot be greater than base price");
      return;
    }

    if (form.imageFiles.length === 0) {
      toast.error("Please keep at least one image");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();

      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("category", form.category);
      if (form.subCategory) formData.append("subCategory", form.subCategory);
      formData.append("basePrice", form.basePrice);
      formData.append("minPrice", form.minPrice);
      formData.append("sku", form.sku);
      formData.append("bestSeller", form.bestSeller);

      formData.append("sizes", JSON.stringify(form.sizes));
      formData.append("colors", JSON.stringify(form.colors));
      formData.append("stock", JSON.stringify(form.stock));
      formData.append(
        "variants",
        JSON.stringify(form.variants.filter((v) => v.price || v.sku))
      );

      // Separate existing (server) images from new uploads
      const existingImages = [];
      const newImages = [];
      const colorImageMap = {};

      form.imageFiles.forEach((img, idx) => {
        if (img.existingUrl) {
          // Kept from server
          existingImages.push({ color: img.color, url: img.existingUrl });
        } else {
          // New upload
          const file = fileMapRef.current[img.id];
          if (file) {
            const newIdx = newImages.length;
            formData.append(`image${newIdx}`, file);
            if (img.color) {
              if (!colorImageMap[img.color]) colorImageMap[img.color] = [];
              colorImageMap[img.color].push(newIdx);
            }
            newImages.push(img);
          }
        }
      });

      formData.append("existingImages", JSON.stringify(existingImages));
      formData.append("colorImageMap", JSON.stringify(colorImageMap));

      const response = await axios.put(
        `${backendUrl}/api/product/update/${id}`,
        formData,
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success("Product updated successfully");
        form.imageFiles.forEach((img) => {
          if (img.preview && !img.existingUrl)
            URL.revokeObjectURL(img.preview);
        });
        fileMapRef.current = {};
        navigate("/list");
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

  if (productLoading && !loaded) {
    return <p className="text-gray-400 py-10">Loading product…</p>;
  }

  if (!productLoading && !currentProduct && !loaded) {
    return (
      <div className="py-10">
        <p className="text-red-500">Product not found.</p>
        <button
          onClick={() => navigate("/list")}
          className="mt-2 text-sm text-blue-500 underline"
        >
          Back to List
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col w-full items-start gap-5 pb-10"
    >
      <div className="flex items-center gap-3 mb-2">
        <button
          type="button"
          onClick={() => navigate("/list")}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to List
        </button>
        <h2 className="text-lg font-medium">Edit Product</h2>
      </div>

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
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {selectedCategory &&
          selectedCategory.subcategories &&
          selectedCategory.subcategories.length > 0 && (
            <div className="flex-1 max-w-[250px]">
              <p className="mb-2 font-medium text-sm">Subcategory</p>
              <select
                value={form.subCategory}
                onChange={(e) =>
                  dispatch(
                    setField({ field: "subCategory", value: e.target.value })
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="">None</option>
                {selectedCategory.subcategories.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          )}
      </div>

      {/* ─────────────── NAME & SKU ─────────────── */}
      <div className="flex flex-col sm:flex-row gap-4 w-full">
        <div className="flex-1">
          <p className="mb-2 font-medium text-sm">
            Product Name <span className="text-red-500">*</span>
          </p>
          <input
            value={form.name}
            onChange={(e) =>
              dispatch(setField({ field: "name", value: e.target.value }))
            }
            className="w-full max-w-[500px] px-3 py-2 border border-gray-300 rounded"
            type="text"
            placeholder="Type here"
          />
        </div>
        <div className="w-48">
          <p className="mb-2 font-medium text-sm">
            SKU <span className="text-red-500">*</span>
          </p>
          <input
            value={form.sku}
            onChange={(e) =>
              dispatch(setField({ field: "sku", value: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded font-mono text-sm"
            type="text"
            placeholder="e.g. SHOE-BLK-42"
          />
        </div>
      </div>

      {/* ─────────────── DESCRIPTION ─────────────── */}
      <div className="w-full">
        <p className="mb-2 font-medium text-sm">
          Description <span className="text-red-500">*</span>
        </p>
        <textarea
          value={form.description}
          onChange={(e) =>
            dispatch(setField({ field: "description", value: e.target.value }))
          }
          className="w-full max-w-[500px] px-3 py-2 border border-gray-300 rounded"
          placeholder="Write content here"
          rows={4}
        />
      </div>

      {/* ─────────────── PRICING ─────────────── */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div>
          <p className="mb-2 font-medium text-sm">
            Base Price ({currency}) <span className="text-red-500">*</span>
          </p>
          <input
            value={form.basePrice}
            onChange={(e) =>
              dispatch(setField({ field: "basePrice", value: e.target.value }))
            }
            className="w-full sm:w-[120px] px-3 py-2 border border-gray-300 rounded"
            type="number"
            min="0"
            placeholder="25"
          />
        </div>
        <div>
          <p className="mb-2 font-medium text-sm">
            Min Price ({currency}) <span className="text-red-500">*</span>
          </p>
          <input
            value={form.minPrice}
            onChange={(e) =>
              dispatch(setField({ field: "minPrice", value: e.target.value }))
            }
            className="w-full sm:w-[120px] px-3 py-2 border border-gray-300 rounded"
            type="number"
            min="0"
            placeholder="20"
          />
        </div>
      </div>

      {/* ─────────────── SIZES ─────────────── */}
      <div className="w-full max-w-[500px]">
        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <input
            type="checkbox"
            checked={form.enableSizes}
            onChange={() => dispatch(toggleSizes())}
          />
          <span className="font-medium text-sm">Enable Sizes</span>
        </label>
        {form.enableSizes && (
          <div className="border border-gray-200 rounded p-3 space-y-2">
            <div className="flex gap-2 flex-wrap">
              {["S", "M", "L", "XL", "XXL"].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() =>
                    form.sizes.includes(s)
                      ? dispatch(removeSize(s))
                      : dispatch(addSize(s))
                  }
                  className={`px-3 py-1 rounded border text-sm ${
                    form.sizes.includes(s)
                      ? "bg-black text-white border-black"
                      : "bg-gray-100 border-gray-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <input
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                placeholder="Custom size…"
                className="border rounded px-2 py-1 text-sm w-32"
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
                className="text-xs bg-gray-200 px-2 py-1 rounded"
              >
                Add
              </button>
            </div>
            {form.sizes.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-1">
                {form.sizes.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-xs"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => dispatch(removeSize(s))}
                      className="text-red-400 hover:text-red-600"
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

      {/* ─────────────── COLORS ─────────────── */}
      <div className="w-full max-w-[500px]">
        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <input
            type="checkbox"
            checked={form.enableColors}
            onChange={() => dispatch(toggleColors())}
          />
          <span className="font-medium text-sm">Enable Colors</span>
        </label>
        {form.enableColors && (
          <div className="border border-gray-200 rounded p-3 space-y-2">
            <div className="flex gap-2 items-end flex-wrap">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Pick</p>
                <input
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  className="w-10 h-8 border rounded cursor-pointer"
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Name</p>
                <input
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  placeholder="e.g. Sky Blue"
                  className="border rounded px-2 py-1 text-sm w-32"
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Hex</p>
                <input
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  className="border rounded px-2 py-1 text-sm w-24 font-mono"
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
                className="text-xs bg-gray-200 px-3 py-1.5 rounded"
              >
                Add
              </button>
            </div>
            {form.colors.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-1">
                {form.colors.map((c) => (
                  <span
                    key={c.name}
                    className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border rounded text-xs"
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-gray-300 inline-block"
                      style={{ backgroundColor: c.hex }}
                    />
                    {c.name}
                    <span className="text-gray-400 font-mono">{c.hex}</span>
                    <button
                      type="button"
                      onClick={() => dispatch(removeColor(c.name))}
                      className="text-red-400 hover:text-red-600 ml-0.5"
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

      {/* ─────────────── STOCK MATRIX ─────────────── */}
      {(form.enableSizes || form.enableColors) &&
        (form.sizes.length > 0 || form.colors.length > 0) && (
          <div className="w-full">
            <p className="mb-2 font-medium text-sm">Stock Quantities</p>
            {warnings.length > 0 && (
              <div className="mb-2 space-y-1">
                {warnings.map((w, i) => (
                  <p key={i} className="text-xs text-amber-600">
                    ⚠ {w}
                  </p>
                ))}
              </div>
            )}
            <div className="border rounded overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {form.enableSizes && form.sizes.length > 0 && (
                      <th className="px-3 py-2 text-left font-medium">Size</th>
                    )}
                    {form.enableColors && form.colors.length > 0 && (
                      <th className="px-3 py-2 text-left font-medium">
                        Color
                      </th>
                    )}
                    <th className="px-3 py-2 text-left font-medium">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {form.stock.map((entry, i) => (
                    <tr key={i} className="border-t">
                      {form.enableSizes && form.sizes.length > 0 && (
                        <td className="px-3 py-1.5">{entry.size || "—"}</td>
                      )}
                      {form.enableColors && form.colors.length > 0 && (
                        <td className="px-3 py-1.5">
                          <span className="inline-flex items-center gap-1">
                            <span
                              className="w-3 h-3 rounded-full border inline-block"
                              style={{
                                backgroundColor: form.colors.find(
                                  (c) => c.name === entry.color
                                )?.hex,
                              }}
                            />
                            {entry.color || "—"}
                          </span>
                        </td>
                      )}
                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          min="0"
                          value={entry.quantity}
                          onChange={(e) =>
                            dispatch(
                              updateStock({
                                size: entry.size,
                                color: entry.color,
                                quantity: e.target.value,
                              })
                            )
                          }
                          className="w-20 border rounded px-2 py-1 text-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* ─────────────── VARIANT PRICING ─────────────── */}
      {(form.sizes.length > 0 || form.colors.length > 0) && (
        <div className="w-full">
          <label className="flex items-center gap-2 cursor-pointer mb-2">
            <input
              type="checkbox"
              checked={showVariantPricing}
              onChange={() => setShowVariantPricing(!showVariantPricing)}
            />
            <span className="font-medium text-sm">
              Override pricing per variant
            </span>
          </label>
          {showVariantPricing && (
            <div className="border rounded overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {form.sizes.length > 0 && (
                      <th className="px-3 py-2 text-left font-medium">Size</th>
                    )}
                    {form.colors.length > 0 && (
                      <th className="px-3 py-2 text-left font-medium">
                        Color
                      </th>
                    )}
                    <th className="px-3 py-2 text-left font-medium">
                      Price ({currency})
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      SKU Override
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(form.sizes.length > 0
                    ? form.sizes
                    : [""]
                  ).flatMap((size) =>
                    (form.colors.length > 0
                      ? form.colors.map((c) => c.name)
                      : [""]
                    ).map((color) => {
                      const variant = form.variants.find(
                        (v) =>
                          v.size === (size || "") && v.color === (color || "")
                      );
                      return (
                        <tr
                          key={`${size}-${color}`}
                          className="border-t"
                        >
                          {form.sizes.length > 0 && (
                            <td className="px-3 py-1.5">{size}</td>
                          )}
                          {form.colors.length > 0 && (
                            <td className="px-3 py-1.5">{color}</td>
                          )}
                          <td className="px-3 py-1.5">
                            <input
                              type="number"
                              min="0"
                              value={variant?.price ?? ""}
                              placeholder={form.basePrice || "—"}
                              onChange={(e) =>
                                dispatch(
                                  updateVariant({
                                    size,
                                    color,
                                    price: e.target.value,
                                  })
                                )
                              }
                              className="w-24 border rounded px-2 py-1 text-sm"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="text"
                              value={variant?.sku ?? ""}
                              placeholder="Optional"
                              onChange={(e) =>
                                dispatch(
                                  updateVariant({
                                    size,
                                    color,
                                    sku: e.target.value,
                                  })
                                )
                              }
                              className="w-32 border rounded px-2 py-1 text-sm font-mono"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─────────────── IMAGES ─────────────── */}
      <div className="w-full">
        <p className="mb-2 font-medium text-sm">Product Images</p>
        <div className="flex gap-3 flex-wrap">
          {form.imageFiles.map((img) => (
            <div
              key={img.id}
              className="relative border rounded p-1 w-24 group"
            >
              <img
                src={img.preview}
                className="w-full h-20 object-cover rounded"
                alt=""
              />
              {form.enableColors && form.colors.length > 0 && (
                <select
                  value={img.color}
                  onChange={(e) =>
                    dispatch(
                      updateImageColor({ id: img.id, color: e.target.value })
                    )
                  }
                  className="w-full text-xs mt-1 border rounded"
                >
                  <option value="">No color</option>
                  {form.colors.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!img.existingUrl && img.preview)
                    URL.revokeObjectURL(img.preview);
                  delete fileMapRef.current[img.id];
                  dispatch(removeImage(img.id));
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
              {img.existingUrl && (
                <span className="absolute top-0.5 left-0.5 bg-green-500 text-white rounded text-[8px] px-1">
                  saved
                </span>
              )}
            </div>
          ))}

          {/* Add image button */}
          <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
            <span className="text-2xl text-gray-400">+</span>
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleImageAdd(e)}
            />
          </label>
        </div>
      </div>

      {/* ─────────────── BEST SELLER ─────────────── */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.bestSeller}
          onChange={(e) =>
            dispatch(
              setField({ field: "bestSeller", value: e.target.checked })
            )
          }
        />
        <span className="text-sm">Mark as Best Seller</span>
      </label>

      {/* ─────────────── SUBMIT ─────────────── */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="w-36 py-3 bg-black text-white rounded hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
        >
          {submitting ? "Updating…" : "Update Product"}
        </button>
        <button
          type="button"
          onClick={() => navigate("/list")}
          className="w-28 py-3 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default Edit;
