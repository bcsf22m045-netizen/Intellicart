import productModel from "../models/productModel.js";

// ── Python Recommendation Service URL ──
const PYTHON_SERVICE_URL =
  process.env.PYTHON_RECOMMENDATION_URL || "http://127.0.0.1:5000";

/**
 * Check if the Python recommendation service is reachable.
 */
const checkPythonService = async () => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const resp = await fetch(`${PYTHON_SERVICE_URL}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (resp.ok) {
      const data = await resp.json();
      return data;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * GET /api/recommendations/:id
 *
 * Returns ML-powered product recommendations for a given product.
 * Flow:
 *   1. Fetch the target product + catalog from MongoDB
 *   2. Send them to the Python ML service for scoring
 *   3. Return scored results to the frontend
 *   Falls back to category-based if the Python service is down.
 *
 * Query params:
 *   - limit (number): Number of recommendations (default: 8, max: 20)
 */
export const getRecommendations = async (req, res) => {
  try {
    const productId = req.params.id;
    const limit = Math.min(Math.max(1, Number(req.query.limit) || 8), 20);

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    // Fetch the target product
    const product = await productModel.findById(productId).lean();
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Fetch catalog products (same category first, then others)
    // We fetch more than needed so ML can pick the best ones
    const catalogSize = Math.min(limit * 10, 100);

    const sameCategoryProducts = await productModel
      .find({ _id: { $ne: productId }, category: product.category })
      .select("name description categoryName subCategoryName basePrice sizes colors bestSeller images averageRating")
      .limit(catalogSize)
      .lean();

    let catalogProducts = [...sameCategoryProducts];

    // Fill with other products if not enough
    if (catalogProducts.length < catalogSize) {
      const remaining = catalogSize - catalogProducts.length;
      const excludeIds = [productId, ...catalogProducts.map((p) => p._id.toString())];
      const otherProducts = await productModel
        .find({ _id: { $nin: excludeIds } })
        .select("name description categoryName subCategoryName basePrice sizes colors bestSeller images averageRating")
        .sort({ bestSeller: -1, averageRating: -1 })
        .limit(remaining)
        .lean();
      catalogProducts.push(...otherProducts);
    }

    if (catalogProducts.length === 0) {
      return res.json({
        success: true,
        recommendations: [],
        source: "no_products",
        modelInfo: null,
      });
    }

    // ── Strategy 1: Call Python ML service ──
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const mlResponse = await fetch(`${PYTHON_SERVICE_URL}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queryProduct: {
            _id: product._id.toString(),
            name: product.name,
            description: product.description,
            categoryName: product.categoryName,
            subCategoryName: product.subCategoryName,
            sizes: product.sizes,
            colors: product.colors,
          },
          catalogProducts: catalogProducts.map((p) => ({
            _id: p._id.toString(),
            name: p.name,
            description: p.description,
            categoryName: p.categoryName,
            subCategoryName: p.subCategoryName,
            sizes: p.sizes,
            colors: p.colors,
          })),
          limit,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (mlResponse.ok) {
        const mlData = await mlResponse.json();

        if (mlData.success && mlData.recommendations?.length > 0) {
          // Map ML scores back to full product documents
          const scoreMap = {};
          mlData.recommendations.forEach((rec) => {
            scoreMap[rec._id] = rec.score;
          });

          const recommendedIds = mlData.recommendations.map((r) => r._id);
          const fullProducts = catalogProducts
            .filter((p) => recommendedIds.includes(p._id.toString()))
            .map((p) => ({
              ...p,
              _similarityScore: scoreMap[p._id.toString()] || 0,
            }))
            .sort((a, b) => b._similarityScore - a._similarityScore);

          return res.json({
            success: true,
            recommendations: fullProducts,
            source: "ml_model",
            modelInfo: {
              type: "hybrid_tfidf_sbert",
              inferenceTimeMs: mlData.inferenceTimeMs,
            },
          });
        }
      }
    } catch (mlErr) {
      // Python service down or timed out — fall through to category fallback
      console.log(
        `ℹ️  Python ML service unavailable (${mlErr.name}), using category fallback`
      );
    }

    // ── Strategy 2: Fallback — category-based recommendations ──
    const fallbackProducts = catalogProducts
      .sort((a, b) => {
        // Prefer same category, then by rating
        const aMatch = a.category?.toString() === product.category?.toString() ? 1 : 0;
        const bMatch = b.category?.toString() === product.category?.toString() ? 1 : 0;
        if (bMatch !== aMatch) return bMatch - aMatch;
        return (b.averageRating || 0) - (a.averageRating || 0);
      })
      .slice(0, limit);

    return res.json({
      success: true,
      recommendations: fallbackProducts,
      source: "category_fallback",
      modelInfo: null,
    });
  } catch (err) {
    console.error("Recommendation error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to get recommendations",
    });
  }
};

/**
 * GET /api/recommendations/model/status
 *
 * Returns the current status of the ML recommendation model.
 * Checks if the Python service is running and models are loaded.
 */
export const getModelStatus = async (req, res) => {
  try {
    const health = await checkPythonService();
    return res.json({
      success: true,
      isModelLoaded: health?.model_loaded ?? false,
      pythonServiceUrl: PYTHON_SERVICE_URL,
      metadata: health?.metadata || null,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * POST /api/recommendations/model/reload
 *
 * Tell the Python service to hot-reload models from disk.
 * Admin-only endpoint.
 */
export const reloadModel = async (req, res) => {
  try {
    const resp = await fetch(`${PYTHON_SERVICE_URL}/reload`, {
      method: "POST",
    });
    const data = await resp.json();
    return res.json({
      success: data.success,
      message: data.message,
      metadata: data.metadata,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: `Cannot reach Python service: ${err.message}`,
    });
  }
};
