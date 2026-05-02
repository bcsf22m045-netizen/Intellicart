/**
 * Export Products from MongoDB to JSON for ML Training
 *
 * Usage:
 *   cd backend
 *   node ml/export_products.js
 *
 * This exports your products collection to a JSON file that can be
 * uploaded to the Google Colab notebook for training.
 *
 * Output: ml/products_export.json
 */

import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportProducts() {
  try {
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/e-commerce_forever";

    console.log(`🔌 Connecting to MongoDB: ${mongoUri.replace(/\/\/.*@/, "//<credentials>@")}`);
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;

    // Fetch all products
    const products = await db.collection("products").find({}).toArray();
    console.log(`📦 Found ${products.length} products`);

    if (products.length === 0) {
      console.log("⚠️  No products found in database!");
      process.exit(1);
    }

    // Fetch categories for name resolution
    const categories = await db.collection("categories").find({}).toArray();
    const categoryMap = {};
    categories.forEach((cat) => {
      categoryMap[cat._id.toString()] = cat;
    });

    // Transform products for export
    const exportData = products.map((p) => {
      // Resolve category/subcategory names
      let categoryName = p.categoryName || "";
      let subCategoryName = p.subCategoryName || "";

      if (!categoryName && p.category) {
        const cat = categoryMap[p.category.toString()];
        if (cat) {
          categoryName = cat.name;
          if (p.subCategory) {
            const sub = cat.subcategories?.find(
              (s) => s._id.toString() === p.subCategory.toString()
            );
            if (sub) subCategoryName = sub.name;
          }
        }
      }

      return {
        _id: p._id.toString(),
        name: p.name || "",
        description: p.description || "",
        categoryName,
        subCategoryName,
        basePrice: p.basePrice || 0,
        minPrice: p.minPrice || 0,
        averageRating: p.averageRating || 0,
        numReviews: p.numReviews || 0,
        bestSeller: p.bestSeller || false,
      };
    });

    // Save to file
    const outputPath = path.join(__dirname, "products_export.json");
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));

    const fileSizeKB = (fs.statSync(outputPath).size / 1024).toFixed(2);
    console.log(`\n✅ Exported ${exportData.length} products to:`);
    console.log(`   ${outputPath} (${fileSizeKB} KB)`);

    // Print summary
    const cats = [...new Set(exportData.map((p) => p.categoryName).filter(Boolean))];
    console.log(`\n📊 Summary:`);
    console.log(`   Categories: ${cats.length > 0 ? cats.join(", ") : "(none resolved)"}`);
    console.log(`   Avg price: $${(exportData.reduce((s, p) => s + p.basePrice, 0) / exportData.length).toFixed(2)}`);

    console.log(`\n📋 Next Steps:`);
    console.log(`   1. Upload products_export.json to Google Colab`);
    console.log(`   2. In the Colab notebook, set DATA_SOURCE = "mongodb_local_export"`);
    console.log(`   3. Run all cells and download the model files`);
    console.log(`   4. Place model files in backend/ml_models/`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Export failed:", err.message);
    process.exit(1);
  }
}

exportProducts();
