import { v2 as cloudinary } from "cloudinary";
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";

// ─── Helper: upload a single file to Cloudinary ──────────────────────────────
const uploadToCloudinary = async (file, folder = "products") => {
  const result = await cloudinary.uploader.upload(file.path, {
    resource_type: "image",
    folder,
  });
  return result.secure_url;
};

// ─── ADD PRODUCT ─────────────────────────────────────────────────────────────
export const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      subCategory,
      sizes,
      colors,
      stock,
      basePrice,
      minPrice,
      sku,
      bestSeller,
      variants,
      colorImageMap, // JSON string: { "Red": [0,1], "Blue": [2] } — maps color to file indexes
    } = req.body;

    // ── Validate required fields ──
    if (!name || !description || !category || !basePrice || !minPrice || !sku) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, description, category, basePrice, minPrice, sku",
      });
    }

    // ── SKU uniqueness ──
    const existingSku = await productModel.findOne({ sku: sku.trim() });
    if (existingSku) {
      return res.status(409).json({
        success: false,
        message: `SKU "${sku}" already exists`,
      });
    }

    // ── Resolve category name ──
    let categoryName = "";
    let subCategoryName = "";
    try {
      const cat = await categoryModel.findById(category);
      if (cat) {
        categoryName = cat.name;
        if (subCategory) {
          const sub = cat.subcategories.id(subCategory);
          if (sub) subCategoryName = sub.name;
        }
      }
    } catch (e) {
      // Non-critical — names are convenience fields
    }

    // ── Upload images ──
    // Files come as image0, image1, image2, … (dynamic count)
    const uploadedImages = [];
    const parsedColorMap = colorImageMap ? JSON.parse(colorImageMap) : {};

    // Build reverse map: fileIndex → color
    const indexToColor = {};
    for (const [color, indexes] of Object.entries(parsedColorMap)) {
      for (const idx of indexes) {
        indexToColor[idx] = color;
      }
    }

    // Upload all image files
    const fileKeys = Object.keys(req.files || {})
      .filter((k) => k.startsWith("image"))
      .sort((a, b) => {
        const numA = parseInt(a.replace("image", ""));
        const numB = parseInt(b.replace("image", ""));
        return numA - numB;
      });

    for (let i = 0; i < fileKeys.length; i++) {
      const fileArr = req.files[fileKeys[i]];
      if (fileArr && fileArr[0]) {
        const url = await uploadToCloudinary(fileArr[0]);
        const fileIndex = parseInt(fileKeys[i].replace("image", ""));
        uploadedImages.push({
          color: indexToColor[fileIndex] || "",
          url,
        });
      }
    }

    // ── Parse JSON fields ──
    const parsedSizes = sizes ? JSON.parse(sizes) : [];
    const parsedColors = colors ? JSON.parse(colors) : [];
    const parsedStock = stock ? JSON.parse(stock) : [];
    const parsedVariants = variants ? JSON.parse(variants) : [];

    // ── Validate stock mapping ──
    if (parsedSizes.length > 0 && parsedColors.length > 0) {
      // Should have stock entries for each size×color combo
      const expected = parsedSizes.length * parsedColors.length;
      if (parsedStock.length > 0 && parsedStock.length < expected) {
        console.warn(
          `Stock mapping incomplete: expected ${expected} entries, got ${parsedStock.length}`
        );
      }
    }

    // ── Build product ──
    const productData = {
      name: name.trim(),
      description: description.trim(),
      category,
      categoryName,
      subCategory: subCategory || null,
      subCategoryName,
      images: uploadedImages,
      sizes: parsedSizes,
      colors: parsedColors,
      stock: parsedStock,
      basePrice: Number(basePrice),
      minPrice: Number(minPrice),
      variants: parsedVariants,
      sku: sku.trim(),
      bestSeller: bestSeller === "true" || bestSeller === true,
      date: Date.now(),
    };

    const product = new productModel(productData);
    await product.save();

    res.json({ success: true, message: "Product Added", product });
  } catch (e) {
    console.error("addProduct error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};

// ─── UPDATE PRODUCT ──────────────────────────────────────────────────────────
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      subCategory,
      sizes,
      colors,
      stock,
      basePrice,
      minPrice,
      sku,
      bestSeller,
      variants,
      colorImageMap,
      existingImages, // JSON string — images to keep from current product
    } = req.body;

    const product = await productModel.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // ── SKU uniqueness (exclude self) ──
    if (sku && sku.trim() !== product.sku) {
      const existingSku = await productModel.findOne({
        _id: { $ne: id },
        sku: sku.trim(),
      });
      if (existingSku) {
        return res.status(409).json({
          success: false,
          message: `SKU "${sku}" already exists`,
        });
      }
    }

    // ── Resolve category name ──
    if (category) {
      try {
        const cat = await categoryModel.findById(category);
        if (cat) {
          product.categoryName = cat.name;
          product.category = category;
          if (subCategory) {
            const sub = cat.subcategories.id(subCategory);
            product.subCategoryName = sub ? sub.name : "";
            product.subCategory = subCategory;
          } else {
            product.subCategory = null;
            product.subCategoryName = "";
          }
        }
      } catch (e) { /* non-critical */ }
    }

    // ── Upload new images ──
    const parsedColorMap = colorImageMap ? JSON.parse(colorImageMap) : {};
    const indexToColor = {};
    for (const [color, indexes] of Object.entries(parsedColorMap)) {
      for (const idx of indexes) {
        indexToColor[idx] = color;
      }
    }

    let updatedImages = existingImages ? JSON.parse(existingImages) : [];

    const fileKeys = Object.keys(req.files || {})
      .filter((k) => k.startsWith("image"))
      .sort((a, b) => parseInt(a.replace("image", "")) - parseInt(b.replace("image", "")));

    for (const key of fileKeys) {
      const fileArr = req.files[key];
      if (fileArr && fileArr[0]) {
        const url = await uploadToCloudinary(fileArr[0]);
        const fileIndex = parseInt(key.replace("image", ""));
        updatedImages.push({
          color: indexToColor[fileIndex] || "",
          url,
        });
      }
    }

    // ── Update fields ──
    if (name) product.name = name.trim();
    if (description) product.description = description.trim();
    if (updatedImages.length > 0) product.images = updatedImages;
    if (sizes) product.sizes = JSON.parse(sizes);
    if (colors) product.colors = JSON.parse(colors);
    if (stock) product.stock = JSON.parse(stock);
    if (basePrice !== undefined) product.basePrice = Number(basePrice);
    if (minPrice !== undefined) product.minPrice = Number(minPrice);
    if (variants) product.variants = JSON.parse(variants);
    if (sku) product.sku = sku.trim();
    if (bestSeller !== undefined)
      product.bestSeller = bestSeller === "true" || bestSeller === true;

    await product.save();

    res.json({ success: true, message: "Product Updated", product });
  } catch (e) {
    console.error("updateProduct error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};

// ─── LIST PRODUCTS (with optional filtering, sorting, pagination) ────────────
export const listProduct = async (req, res) => {
  try {
    const {
      category,       // category ObjectId or categoryName
      subCategory,    // subCategory ObjectId or subCategoryName
      minPrice,
      maxPrice,
      search,
      sort,           // "price-asc", "price-desc", "newest", "oldest"
      bestSeller,     // "true"
      page = 1,
      limit = 0,      // 0 = return all (backward compat)
    } = req.query;

    const filter = {};

    // ── Category filter — accepts ObjectId or name string ──
    if (category) {
      const cats = category.split(",").map((c) => c.trim()).filter(Boolean);
      // Check if values look like ObjectIds (24 hex chars)
      const isObjectId = cats.every((c) => /^[a-f\d]{24}$/i.test(c));
      if (isObjectId) {
        filter.category = { $in: cats };
      } else {
        filter.categoryName = { $in: cats.map((c) => new RegExp(`^${c}$`, "i")) };
      }
    }

    // ── Subcategory filter ──
    if (subCategory) {
      const subs = subCategory.split(",").map((s) => s.trim()).filter(Boolean);
      const isObjectId = subs.every((s) => /^[a-f\d]{24}$/i.test(s));
      if (isObjectId) {
        filter.subCategory = { $in: subs };
      } else {
        filter.subCategoryName = { $in: subs.map((s) => new RegExp(`^${s}$`, "i")) };
      }
    }

    // ── Price range ──
    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) filter.basePrice.$gte = Number(minPrice);
      if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
    }

    // ── Text search ──
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }

    // ── Best seller ──
    if (bestSeller === "true") {
      filter.bestSeller = true;
    }

    // ── Sorting ──
    let sortObj = { date: -1 }; // default: newest first
    switch (sort) {
      case "price-asc":
        sortObj = { basePrice: 1 };
        break;
      case "price-desc":
        sortObj = { basePrice: -1 };
        break;
      case "newest":
        sortObj = { date: -1 };
        break;
      case "oldest":
        sortObj = { date: 1 };
        break;
    }

    // ── Pagination ──
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(0, Number(limit));
    const skip = limitNum > 0 ? (pageNum - 1) * limitNum : 0;

    let query = productModel.find(filter).sort(sortObj);
    if (limitNum > 0) {
      query = query.skip(skip).limit(limitNum);
    }

    const [products, total] = await Promise.all([
      query,
      productModel.countDocuments(filter),
    ]);

    res.json({
      success: true,
      products,
      total,
      page: pageNum,
      pages: limitNum > 0 ? Math.ceil(total / limitNum) : 1,
    });
  } catch (e) {
    console.error(e);
    res.json({ success: false, message: e.message });
  }
};

// ─── REMOVE PRODUCT ──────────────────────────────────────────────────────────
export const removeProduct = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.body.id);
    res.json({ success: true, message: "Product Removed" });
  } catch (e) {
    console.error(e);
    res.json({ success: false, message: e.message });
  }
};

// ─── SINGLE PRODUCT ─────────────────────────────────────────────────────────
export const singleProduct = async (req, res) => {
  try {
    // Support both POST body { productId } and GET param :id
    const productId = req.params.id || req.body.productId;
    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, product });
  } catch (e) {
    console.error(e);
    res.json({ success: false, message: e.message });
  }
};
