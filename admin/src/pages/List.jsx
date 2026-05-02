import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  fetchProducts,
  deleteProduct,
  selectProducts,
  selectProductsLoading,
} from "../store/slices/productSlice";
import { currency } from "../App";

const List = ({ token }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const products = useSelector(selectProducts);
  const loading = useSelector(selectProductsLoading);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await dispatch(deleteProduct({ id, token })).unwrap();
      toast.success("Product Removed");
    } catch (err) {
      toast.error(err || "Failed to delete product");
    }
  };

  const handleEdit = (id) => {
    navigate(`/edit/${id}`);
  };

  // Helper to get first image URL from product
  const getFirstImage = (product) => {
    if (product.images && product.images.length > 0) {
      return product.images[0].url;
    }
    if (product.image && product.image.length > 0) {
      return product.image[0];
    }
    return "";
  };

  // Get display price
  const getPrice = (product) => {
    return product.basePrice ?? product.price ?? 0;
  };

  // Get category display name
  const getCategoryName = (product) => {
    return product.categoryName || product.category || "—";
  };

  // Total stock
  const getTotalStock = (product) => {
    if (product.stock && product.stock.length > 0) {
      return product.stock.reduce((sum, s) => sum + (s.quantity || 0), 0);
    }
    return "—";
  };

  // Filtered + reversed list
  const filteredList = [...products]
    .reverse()
    .filter((item) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        item.name?.toLowerCase().includes(q) ||
        item.sku?.toLowerCase().includes(q) ||
        (item.categoryName || "").toLowerCase().includes(q)
      );
    });

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <p className="text-lg font-medium">
          All Products{" "}
          <span className="text-sm text-gray-400 font-normal">
            ({filteredList.length})
          </span>
        </p>
        <input
          type="text"
          placeholder="Search by name, SKU, or category…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full sm:w-72 focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
      </div>

      {loading && products.length === 0 && (
        <p className="text-gray-400 text-sm py-4">Loading products…</p>
      )}

      <div className="flex flex-col gap-2">
        {/* LIST TABLE TITLE */}
        <div className="hidden md:grid grid-cols-[0.5fr_2fr_1fr_1fr_0.5fr_0.5fr_0.8fr] items-center py-2 px-2 border text-sm bg-gray-100 font-medium">
          <span>Image</span>
          <span>Name</span>
          <span>Category</span>
          <span>SKU</span>
          <span>Price</span>
          <span>Stock</span>
          <span className="text-center">Actions</span>
        </div>

        {/* PRODUCT LIST */}
        {filteredList.map((item) => (
          <div key={item._id}>
            {/* Main row */}
            <div
              className="grid grid-cols-[1fr_3fr_1fr] md:grid-cols-[0.5fr_2fr_1fr_1fr_0.5fr_0.5fr_0.8fr] items-center gap-2 py-2 px-2 border text-sm cursor-pointer hover:bg-gray-50"
              onClick={() =>
                setExpandedId(expandedId === item._id ? null : item._id)
              }
            >
              <img
                className="w-12 h-12 object-cover rounded"
                src={getFirstImage(item)}
                alt=""
              />
              <div>
                <p className="font-medium">{item.name}</p>
                {item.colors && item.colors.length > 0 && (
                  <div className="flex items-center gap-1 mt-0.5">
                    {item.colors.map((c, i) => (
                      <span
                        key={i}
                        title={typeof c === "object" ? c.name : c}
                        className="w-4 h-4 rounded-full border border-gray-300 inline-block"
                        style={{
                          backgroundColor:
                            typeof c === "object" ? c.hex : undefined,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <p>{getCategoryName(item)}</p>
              <p className="text-xs text-gray-500 font-mono">
                {item.sku || "—"}
              </p>
              <p>
                {currency}
                {getPrice(item)}
              </p>
              <p>{getTotalStock(item)}</p>
              <div
                className="flex items-center justify-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => handleEdit(item._id)}
                  className="text-blue-500 hover:text-blue-700 text-xs font-medium px-2 py-1 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item._id)}
                  className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 border border-red-300 rounded hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Expanded detail */}
            {expandedId === item._id && (
              <div className="border border-t-0 bg-gray-50 p-4 text-sm space-y-3">
                <div className="flex gap-6 flex-wrap">
                  <div>
                    <span className="font-medium">Base Price: </span>
                    {currency}{item.basePrice ?? item.price}
                  </div>
                  {item.minPrice !== undefined && (
                    <div>
                      <span className="font-medium">Min Price: </span>
                      {currency}{item.minPrice}
                    </div>
                  )}
                  {item.subCategoryName && (
                    <div>
                      <span className="font-medium">Subcategory: </span>
                      {item.subCategoryName}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Best Seller: </span>
                    {item.bestSeller ? "Yes" : "No"}
                  </div>
                </div>

                {/* Sizes */}
                {item.sizes && item.sizes.length > 0 && (
                  <div>
                    <span className="font-medium">Sizes: </span>
                    {item.sizes.join(", ")}
                  </div>
                )}

                {/* Colors */}
                {item.colors && item.colors.length > 0 && (
                  <div>
                    <span className="font-medium block mb-1">Colors:</span>
                    <div className="flex gap-2 flex-wrap">
                      {item.colors.map((c, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border rounded text-xs"
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-gray-300 inline-block"
                            style={{
                              backgroundColor:
                                typeof c === "object" ? c.hex : undefined,
                            }}
                          />
                          {typeof c === "object" ? c.name : c}
                          {typeof c === "object" && (
                            <span className="text-gray-400 font-mono">
                              {c.hex}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stock */}
                {item.stock && item.stock.length > 0 && (
                  <div>
                    <span className="font-medium block mb-1">Stock:</span>
                    <div className="flex gap-2 flex-wrap">
                      {item.stock.map((s, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-white border rounded text-xs"
                        >
                          {s.size && <span>{s.size}</span>}
                          {s.size && s.color && <span> / </span>}
                          {s.color && <span>{s.color}</span>}
                          {(s.size || s.color) && <span>: </span>}
                          <span className="font-medium">{s.quantity}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Images */}
                {item.images && item.images.length > 0 && (
                  <div>
                    <span className="font-medium block mb-1">Images:</span>
                    <div className="flex gap-2 flex-wrap">
                      {item.images.map((img, i) => (
                        <div key={i} className="text-center">
                          <img
                            src={img.url}
                            className="w-16 h-16 object-cover rounded border"
                            alt=""
                          />
                          {img.color && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {img.color}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <span className="font-medium">Description: </span>
                  <span className="text-gray-600">
                    {item.description?.substring(0, 300)}
                    {item.description?.length > 300 ? "…" : ""}
                  </span>
                </div>

                {/* Quick Edit button in expanded view */}
                <div className="pt-2 border-t">
                  <button
                    onClick={() => handleEdit(item._id)}
                    className="bg-black text-white text-xs px-4 py-2 rounded hover:bg-gray-800 transition-colors"
                  >
                    Edit Product
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {!loading && filteredList.length === 0 && (
          <p className="text-gray-400 text-sm py-4">No products found.</p>
        )}
      </div>
    </>
  );
};

export default List;
