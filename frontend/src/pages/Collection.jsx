import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import Title from "../components/Title";
import ProductItem from "../components/ProductItem";

const Collection = () => {
  const { products, search, showSearch, currency, categories } =
    useContext(ShopContext);

  const [searchParams, setSearchParams] = useSearchParams();

  const [showFilter, setShowFilter] = useState(false);
  const [filterProducts, setFilterProducts] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [sortType, setSortType] = useState("relevant");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [initializedFromUrl, setInitializedFromUrl] = useState(false);

  // ── Read category from URL on mount / when URL changes ──
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam && categories.length > 0) {
      // Case-insensitive match against actual category names
      const matched = categories.filter(
        (cat) => cat.name.toLowerCase() === categoryParam.toLowerCase()
      );
      if (matched.length > 0) {
        setSelectedCategories([matched[0].name]);
      } else {
        // Invalid category — set it anyway so "no products" shows
        setSelectedCategories([categoryParam]);
      }
      setSelectedSubCategories([]);
    } else if (!categoryParam) {
      // No category in URL — only clear on first init or when param is removed
      if (initializedFromUrl) {
        setSelectedCategories([]);
        setSelectedSubCategories([]);
      }
    }
    setInitializedFromUrl(true);
  }, [searchParams, categories]);

  // ── Sync URL when selectedCategories change (after initial load) ──
  useEffect(() => {
    if (!initializedFromUrl) return;

    if (selectedCategories.length === 1) {
      setSearchParams(
        { category: selectedCategories[0].toLowerCase() },
        { replace: true }
      );
    } else if (selectedCategories.length === 0 || selectedCategories.length > 1) {
      // Multiple categories or none — remove query param
      if (searchParams.has("category")) {
        searchParams.delete("category");
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [selectedCategories, initializedFromUrl]);

  // ── Derived: subcategories of all selected categories ──
  const availableSubCategories = categories
    .filter(
      (cat) =>
        selectedCategories.length === 0 ||
        selectedCategories.includes(cat.name)
    )
    .flatMap((cat) => (cat.subcategories || []).map((sub) => sub.name))
    .filter((name, i, arr) => arr.indexOf(name) === i); // unique

  // ── Toggle helpers ──
  const toggleCategory = (name) => {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
    // Clear subcategory selections that no longer apply
    setSelectedSubCategories([]);
  };

  const toggleSubCategory = (name) => {
    setSelectedSubCategories((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  // ── Apply Filters ──
  const applyFilter = () => {
    let filtered = products.slice();

    // Text search
    if (showSearch && search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(q)
      );
    }

    // Category filter (case-insensitive)
    if (selectedCategories.length > 0) {
      const lowerSelected = selectedCategories.map((c) => c.toLowerCase());
      filtered = filtered.filter((item) =>
        lowerSelected.includes(
          (item.categoryName || item.category || "").toLowerCase()
        )
      );
    }

    // Subcategory filter (case-insensitive)
    if (selectedSubCategories.length > 0) {
      const lowerSelectedSub = selectedSubCategories.map((c) => c.toLowerCase());
      filtered = filtered.filter((item) =>
        lowerSelectedSub.includes(
          (item.subCategoryName || item.subCategory || "").toLowerCase()
        )
      );
    }

    // Price range filter
    const min = Number(priceRange.min);
    const max = Number(priceRange.max);
    if (min > 0) {
      filtered = filtered.filter((item) => (item.price ?? item.basePrice) >= min);
    }
    if (max > 0) {
      filtered = filtered.filter((item) => (item.price ?? item.basePrice) <= max);
    }

    setFilterProducts(filtered);
  };

  // ── Sort ──
  const sortProduct = () => {
    let fpCopy = filterProducts.slice();

    switch (sortType) {
      case "low-high":
        setFilterProducts(fpCopy.sort((a, b) => (a.price ?? a.basePrice) - (b.price ?? b.basePrice)));
        break;
      case "high-low":
        setFilterProducts(fpCopy.sort((a, b) => (b.price ?? b.basePrice) - (a.price ?? a.basePrice)));
        break;
      default:
        applyFilter();
        break;
    }
  };

  useEffect(() => {
    applyFilter();
  }, [selectedCategories, selectedSubCategories, priceRange, search, showSearch, products]);

  useEffect(() => {
    sortProduct();
  }, [sortType]);

  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t">
      {/* ─── FILTER SIDEBAR ─── */}
      <div className="min-w-60">
        <p
          onClick={() => setShowFilter(!showFilter)}
          className="my-2 text-xl flex items-center cursor-pointer gap-2"
        >
          FILTERS
          <img
            src={assets.dropdown_icon}
            className={`h-3 sm:hidden ${showFilter ? "rotate-90" : ""}`}
            alt=""
          />
        </p>

        {/* CATEGORY FILTER */}
        <div
          className={`border border-gray-300 pl-5 py-3 mt-6 ${
            showFilter ? " " : "hidden"
          } sm:block`}
        >
          <p className="mb-3 text-sm font-medium">CATEGORIES</p>
          <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
            {categories.length > 0 ? (
              categories.map((cat) => (
                <p className="flex gap-2" key={cat._id}>
                  <input
                    className="w-3"
                    type="checkbox"
                    checked={selectedCategories.includes(cat.name)}
                    onChange={() => toggleCategory(cat.name)}
                  />{" "}
                  {cat.name}
                </p>
              ))
            ) : (
              <p className="text-gray-400 text-xs">Loading…</p>
            )}
          </div>
        </div>

        {/* SUBCATEGORY FILTER */}
        {availableSubCategories.length > 0 && (
          <div
            className={`border border-gray-300 pl-5 py-3 my-5 ${
              showFilter ? " " : "hidden"
            } sm:block`}
          >
            <p className="mb-3 text-sm font-medium">TYPE</p>
            <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
              {availableSubCategories.map((subName) => (
                <p className="flex gap-2" key={subName}>
                  <input
                    className="w-3"
                    type="checkbox"
                    checked={selectedSubCategories.includes(subName)}
                    onChange={() => toggleSubCategory(subName)}
                  />{" "}
                  {subName}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* PRICE RANGE FILTER */}
        <div
          className={`border border-gray-300 pl-5 pr-4 py-3 my-5 ${
            showFilter ? " " : "hidden"
          } sm:block`}
        >
          <p className="mb-3 text-sm font-medium">PRICE RANGE</p>
          <div className="flex gap-2 items-center text-sm">
            <input
              type="number"
              min="0"
              placeholder="Min"
              value={priceRange.min}
              onChange={(e) =>
                setPriceRange((p) => ({ ...p, min: e.target.value }))
              }
              className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
            />
            <span className="text-gray-400">–</span>
            <input
              type="number"
              min="0"
              placeholder="Max"
              value={priceRange.max}
              onChange={(e) =>
                setPriceRange((p) => ({ ...p, max: e.target.value }))
              }
              className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          {(priceRange.min || priceRange.max) && (
            <button
              onClick={() => setPriceRange({ min: "", max: "" })}
              className="text-xs text-gray-500 mt-2 hover:text-gray-700"
            >
              Clear price filter
            </button>
          )}
        </div>

        {/* ACTIVE FILTERS SUMMARY */}
        {(selectedCategories.length > 0 ||
          selectedSubCategories.length > 0 ||
          priceRange.min ||
          priceRange.max) && (
          <button
            onClick={() => {
              setSelectedCategories([]);
              setSelectedSubCategories([]);
              setPriceRange({ min: "", max: "" });
            }}
            className={`text-xs text-red-500 hover:text-red-700 mb-4 ${
              showFilter ? "" : "hidden"
            } sm:block`}
          >
            ✕ Clear all filters
          </button>
        )}
      </div>

      {/* ─── RIGHT SIDE ─── */}
      <div className="flex-1">
        <div className="flex justify-between text-base sm:text-2xl mb-4">
          <Title text1={"ALL"} text2={"COLLECTIONS"} />

          {/* PRODUCT SORT */}
          <select
            onChange={(e) => setSortType(e.target.value)}
            className="border-2 border-gray-300 text-sm px-2"
          >
            <option value="relevant">Sort by: Relevant</option>
            <option value="low-high">Sort by: Low to High</option>
            <option value="high-low">Sort by: High to Low</option>
          </select>
        </div>

        {/* RESULT COUNT */}
        <p className="text-sm text-gray-400 mb-3">
          {filterProducts.length} product{filterProducts.length !== 1 ? "s" : ""} found
        </p>

        {/* MAP PRODUCTS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
          {filterProducts.map((item, i) => (
            <ProductItem
              key={i}
              id={item._id}
              image={item.image}
              name={item.name}
              price={item.price}
            />
          ))}
        </div>

        {filterProducts.length === 0 && (
          <p className="text-gray-400 text-center py-10">
            No products match your filters.
          </p>
        )}
      </div>
    </div>
  );
};

export default Collection;
