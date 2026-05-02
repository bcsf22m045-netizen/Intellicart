import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchRecommendations,
  clearRecommendations,
  selectRecommendations,
  selectRecommendationsLoading,
  selectRecommendationsSource,
} from "../store/slices/recommendationSlice";
import Title from "./Title";
import ProductItem from "./ProductItem";

/**
 * MLRecommendations — ML-powered product recommendations
 *
 * Replaces the basic category-based RelatedProduct component with
 * intelligent recommendations from the TF-IDF + Cosine Similarity model.
 *
 * Falls back gracefully to category-based if ML model is unavailable.
 *
 * Props:
 *   - productId: Current product MongoDB _id
 *   - limit: Number of recommendations to show (default: 5)
 */
const MLRecommendations = ({ productId, limit = 5 }) => {
  const dispatch = useDispatch();
  const recommendations = useSelector(selectRecommendations);
  const loading = useSelector(selectRecommendationsLoading);
  const source = useSelector(selectRecommendationsSource);

  useEffect(() => {
    if (productId) {
      dispatch(fetchRecommendations({ productId, limit: limit + 5 }));
    }

    return () => {
      dispatch(clearRecommendations());
    };
  }, [productId, limit, dispatch]);

  // Don't render if no recommendations
  if (!loading && recommendations.length === 0) return null;

  // Get image array from product (handles both new and legacy format)
  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      return product.images.map((img) => img.url);
    }
    if (product.image && product.image.length > 0) {
      return product.image;
    }
    return ["/placeholder.png"];
  };

  return (
    <div className="my-24">
      <div className="text-center text-3xl py-2">
        <Title text1={"RECOMMENDED"} text2={"FOR YOU"} />
      </div>

      {/* Source indicator */}
      {source && (
        <div className="flex justify-center mb-4">
          <span
            className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full ${
              source === "ml_model"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-gray-50 text-gray-500 border border-gray-200"
            }`}
          >
            {source === "ml_model" ? (
              <>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2L3 7l7 5 7-5-7-5zM3 12l7 5 7-5M3 17l7 5 7-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                AI Powered
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Similar Products
              </>
            )}
          </span>
        </div>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 gap-y-6">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-gray-200 rounded" />
              <div className="mt-3 h-4 bg-gray-200 rounded w-3/4" />
              <div className="mt-2 h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 gap-y-6">
          {recommendations.slice(0, limit).map((product, i) => (
            <ProductItem
              key={product._id || i}
              id={product._id}
              image={getProductImage(product)}
              name={product.name}
              price={product.price ?? product.basePrice}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MLRecommendations;
