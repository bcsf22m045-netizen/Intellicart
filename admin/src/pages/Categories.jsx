import { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";

const Categories = ({ token }) => {
  // ─── State ───────────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Category form
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryImage, setCategoryImage] = useState(null);

  // Subcategory form
  const [showSubForm, setShowSubForm] = useState(null); // category ID or null
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [subName, setSubName] = useState("");
  const [subImage, setSubImage] = useState(null);

  // Expanded categories (to show subcategories)
  const [expandedCategories, setExpandedCategories] = useState({});

  // ─── Fetch Categories ────────────────────────────────────────────────────────
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get(backendUrl + "/api/category/list");
      if (response.data.success) {
        setCategories(response.data.categories);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ─── Category CRUD ──────────────────────────────────────────────────────────

  const resetCategoryForm = () => {
    setCategoryName("");
    setCategoryDescription("");
    setCategoryImage(null);
    setEditingCategory(null);
    setShowCategoryForm(false);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", categoryName);
    formData.append("description", categoryDescription);
    if (categoryImage) {
      formData.append("image", categoryImage);
    }

    try {
      let response;
      if (editingCategory) {
        response = await axios.put(
          backendUrl + "/api/category/update/" + editingCategory._id,
          formData,
          { headers: { token } }
        );
      } else {
        response = await axios.post(
          backendUrl + "/api/category/add",
          formData,
          { headers: { token } }
        );
      }

      if (response.data.success) {
        toast.success(response.data.message);
        resetCategoryForm();
        fetchCategories();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryDescription(category.description || "");
    setCategoryImage(null);
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Delete this category and all its subcategories?")) return;

    try {
      const response = await axios.delete(
        backendUrl + "/api/category/delete/" + id,
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success(response.data.message);
        fetchCategories();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // ─── Subcategory CRUD ──────────────────────────────────────────────────────

  const resetSubForm = () => {
    setSubName("");
    setSubImage(null);
    setEditingSubcategory(null);
    setShowSubForm(null);
  };

  const handleSubcategorySubmit = async (e, categoryId) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", subName);
    if (subImage) {
      formData.append("image", subImage);
    }

    try {
      let response;
      if (editingSubcategory) {
        response = await axios.put(
          backendUrl +
            "/api/category/" +
            categoryId +
            "/subcategory/" +
            editingSubcategory._id,
          formData,
          { headers: { token } }
        );
      } else {
        response = await axios.post(
          backendUrl + "/api/category/" + categoryId + "/subcategory/add",
          formData,
          { headers: { token } }
        );
      }

      if (response.data.success) {
        toast.success(response.data.message);
        resetSubForm();
        fetchCategories();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const handleEditSubcategory = (categoryId, sub) => {
    setShowSubForm(categoryId);
    setEditingSubcategory(sub);
    setSubName(sub.name);
    setSubImage(null);
  };

  const handleDeleteSubcategory = async (categoryId, subId) => {
    if (!window.confirm("Delete this subcategory?")) return;

    try {
      const response = await axios.delete(
        backendUrl + "/api/category/" + categoryId + "/subcategory/" + subId,
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success(response.data.message);
        fetchCategories();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // ─── Toggle expand ──────────────────────────────────────────────────────────

  const toggleExpand = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Categories</h1>
        <button
          onClick={() => {
            resetCategoryForm();
            setShowCategoryForm(true);
          }}
          className="bg-black text-white px-5 py-2 rounded-md text-sm hover:bg-gray-800 transition-colors"
        >
          + Add Category
        </button>
      </div>

      {/* ─── Category Form (Add / Edit) ─────────────────────────────────────── */}
      {showCategoryForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-medium mb-4">
            {editingCategory ? "Edit Category" : "Add New Category"}
          </h2>
          <form onSubmit={handleCategorySubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                required
                placeholder="e.g. Men, Women, Kids"
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCategoryImage(e.target.files[0])}
                className="text-sm"
              />
              {editingCategory?.image && !categoryImage && (
                <img
                  src={editingCategory.image}
                  alt=""
                  className="mt-2 w-16 h-16 object-cover rounded"
                />
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-black text-white px-5 py-2 rounded-md text-sm hover:bg-gray-800 transition-colors"
              >
                {editingCategory ? "Update" : "Add"}
              </button>
              <button
                type="button"
                onClick={resetCategoryForm}
                className="border border-gray-300 px-5 py-2 rounded-md text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Categories List ────────────────────────────────────────────────── */}
      {loading ? (
        <p className="text-gray-500">Loading categories...</p>
      ) : categories.length === 0 ? (
        <p className="text-gray-500">
          No categories yet. Click "Add Category" to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {categories.map((category) => (
            <div
              key={category._id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
            >
              {/* Category Row */}
              <div className="flex items-center justify-between px-5 py-4">
                <div
                  className="flex items-center gap-4 flex-1 cursor-pointer"
                  onClick={() => toggleExpand(category._id)}
                >
                  {/* Expand arrow */}
                  <span
                    className={`text-gray-400 transition-transform ${
                      expandedCategories[category._id] ? "rotate-90" : ""
                    }`}
                  >
                    ▶
                  </span>
                  {/* Image */}
                  {category.image && (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  )}
                  <div>
                    <p className="font-medium text-gray-800">{category.name}</p>
                    {category.description && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {category.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {category.subcategories.length} subcategor
                      {category.subcategories.length === 1 ? "y" : "ies"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="text-sm text-blue-600 hover:text-blue-800 px-2 py-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category._id)}
                    className="text-sm text-red-500 hover:text-red-700 px-2 py-1"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Expanded Subcategories */}
              {expandedCategories[category._id] && (
                <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-600">
                      Subcategories
                    </h3>
                    <button
                      onClick={() => {
                        resetSubForm();
                        setShowSubForm(category._id);
                      }}
                      className="text-xs bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-700 transition-colors"
                    >
                      + Add Subcategory
                    </button>
                  </div>

                  {/* Subcategory Form */}
                  {showSubForm === category._id && (
                    <div className="bg-white border border-gray-200 rounded-md p-4 mb-3">
                      <form
                        onSubmit={(e) =>
                          handleSubcategorySubmit(e, category._id)
                        }
                        className="space-y-3"
                      >
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={subName}
                            onChange={(e) => setSubName(e.target.value)}
                            required
                            placeholder="e.g. Topwear, Bottomwear"
                            className="w-full max-w-sm px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Image
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setSubImage(e.target.files[0])}
                            className="text-xs"
                          />
                          {editingSubcategory?.image && !subImage && (
                            <img
                              src={editingSubcategory.image}
                              alt=""
                              className="mt-1 w-12 h-12 object-cover rounded"
                            />
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="bg-black text-white px-4 py-1.5 rounded-md text-xs hover:bg-gray-800 transition-colors"
                          >
                            {editingSubcategory ? "Update" : "Add"}
                          </button>
                          <button
                            type="button"
                            onClick={resetSubForm}
                            className="border border-gray-300 px-4 py-1.5 rounded-md text-xs hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Subcategory List */}
                  {category.subcategories.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">
                      No subcategories yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {category.subcategories.map((sub) => (
                        <div
                          key={sub._id}
                          className="flex items-center justify-between bg-white border border-gray-200 rounded-md px-4 py-2.5"
                        >
                          <div className="flex items-center gap-3">
                            {sub.image && (
                              <img
                                src={sub.image}
                                alt={sub.name}
                                className="w-8 h-8 object-cover rounded"
                              />
                            )}
                            <span className="text-sm text-gray-700">
                              {sub.name}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleEditSubcategory(category._id, sub)
                              }
                              className="text-xs text-blue-600 hover:text-blue-800 px-1.5 py-0.5"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteSubcategory(category._id, sub._id)
                              }
                              className="text-xs text-red-500 hover:text-red-700 px-1.5 py-0.5"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Categories;
