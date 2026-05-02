import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import RelatedProduct from "../components/RelatedProduct";
import MLRecommendations from "../components/MLRecommendations";
import { selectAuth, selectUser } from "../store/slices/authSlice";
import {
  fetchProductReviews,
  createReview,
  updateReview,
  deleteReview,
  selectReviews,
  selectReviewsLoading,
  selectReviewSubmitting,
  clearReviews,
} from "../store/slices/reviewSlice";
import { toast } from "react-toastify";

const Product = () => {
  const { productId } = useParams();
  const { products, currency, addToCart, navigate } = useContext(ShopContext);
  const dispatch = useDispatch();

  // Auth & review state
  const { isAuthenticated } = useSelector(selectAuth);
  const currentUser = useSelector(selectUser);
  const reviews = useSelector(selectReviews);
  const reviewsLoading = useSelector(selectReviewsLoading);
  const reviewSubmitting = useSelector(selectReviewSubmitting);

  const [productData, setProductData] = useState(false);
  const [image, setImage] = useState("");
  const [size, setSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  // Review form state
  const [activeTab, setActiveTab] = useState("description");
  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [editingReviewId, setEditingReviewId] = useState(null);

  const fetchProductData = async () => {
    products.map((item) => {
      if (item._id === productId) {
        setProductData(item);
        // Set initial image
        if (item.images && item.images.length > 0) {
          setImage(item.images[0].url);
        } else if (item.image && item.image.length > 0) {
          setImage(item.image[0]);
        }
        // Set initial color if product has colors
        if (item.colors && item.colors.length > 0) {
          setSelectedColor(item.colors[0].name);
        }
        return null;
      }
    });
  };

  useEffect(() => {
    fetchProductData();
  }, [productId, products]);

  // Fetch reviews when product changes
  useEffect(() => {
    if (productId) {
      dispatch(fetchProductReviews(productId));
    }
    return () => {
      dispatch(clearReviews());
    };
  }, [productId, dispatch]);

  // ── Review computed values ──
  const userReview = isAuthenticated && currentUser
    ? reviews.find((r) => r.user?._id === currentUser._id || r.user === currentUser._id)
    : null;

  const computedAvgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : productData?.averageRating || 0;

  const numReviewsDisplay = reviews.length || productData?.numReviews || 0;

  // ── Review handlers ──
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewRating) {
      toast.error("Please select a rating");
      return;
    }
    if (!reviewComment.trim()) {
      toast.error("Please write a comment");
      return;
    }

    try {
      if (editingReviewId) {
        await dispatch(
          updateReview({
            reviewId: editingReviewId,
            rating: reviewRating,
            comment: reviewComment,
          })
        ).unwrap();
        toast.success("Review updated!");
        setEditingReviewId(null);
      } else {
        await dispatch(
          createReview({
            productId,
            rating: reviewRating,
            comment: reviewComment,
          })
        ).unwrap();
        toast.success("Review submitted!");
      }
      setReviewRating(0);
      setReviewComment("");
      // Re-fetch to get updated product averageRating
      dispatch(fetchProductReviews(productId));
    } catch (err) {
      toast.error(err || "Failed to submit review");
    }
  };

  const handleEditReview = (review) => {
    setEditingReviewId(review._id);
    setReviewRating(review.rating);
    setReviewComment(review.comment);
    setActiveTab("reviews");
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete your review?")) return;
    try {
      await dispatch(deleteReview(reviewId)).unwrap();
      toast.success("Review deleted!");
      dispatch(fetchProductReviews(productId));
    } catch (err) {
      toast.error(err || "Failed to delete review");
    }
  };

  const cancelEdit = () => {
    setEditingReviewId(null);
    setReviewRating(0);
    setReviewComment("");
  };

  // ── Get ALL images (always show full gallery) ──
  const getAllImages = () => {
    if (!productData) return [];

    // New format: images = [{ color, url }]
    if (productData.images && productData.images.length > 0) {
      return productData.images;
    }

    // Legacy format: image = ["url1", "url2"]
    if (productData.image && productData.image.length > 0) {
      return productData.image.map((url) => ({ color: "", url }));
    }

    return [];
  };

  // ── Get the display price (check variant pricing) ──
  const getDisplayPrice = () => {
    if (!productData) return 0;

    // Check for variant-specific pricing
    if (productData.variants && productData.variants.length > 0) {
      const variant = productData.variants.find(
        (v) =>
          (!v.size || v.size === size) &&
          (!v.color || v.color === selectedColor)
      );
      if (variant && variant.price) return variant.price;
    }

    return productData.price ?? productData.basePrice ?? 0;
  };

  // ── When color changes, update the main image ──
  useEffect(() => {
    if (!productData || !selectedColor) return;

    if (productData.images && productData.images.length > 0) {
      const colorImg = productData.images.find(
        (img) => img.color === selectedColor
      );
      if (colorImg) {
        setImage(colorImg.url);
      }
    }
  }, [selectedColor, productData]);

  const allImages = getAllImages();
  const displayPrice = getDisplayPrice();
  const hasColors = productData && productData.colors && productData.colors.length > 0;
  const hasSizes = productData && productData.sizes && productData.sizes.length > 0;

  // ── Stock check for current selection ──
  const getStockForSelection = () => {
    if (!productData || !productData.stock || productData.stock.length === 0)
      return Infinity; // no stock tracking
    const entry = productData.stock.find(
      (s) =>
        (s.size || "") === (size || "") &&
        (s.color || "") === (selectedColor || "")
    );
    return entry ? entry.quantity : 0;
  };

  const currentStock = getStockForSelection();
  const isOutOfStock = currentStock === 0;

  return productData ? (
    <div className="border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100">
      {/* PRODUCT DATA */}
      <div className="flex gap-12 sm:gap-12 flex-col sm:flex-row">
        {/* PRODUCT IMAGES */}
        <div className="flex-1 flex flex-col-reverse gap-3 sm:flex-row">
          {/* Sidebar thumbnails — match main image height */}
          <div className="flex sm:flex-col overflow-x-auto sm:overflow-y-auto justify-between sm:justify-start sm:w-[18.7%] w-full sm:max-h-[500px]">
            {allImages.map((img, i) => {
              const isSelected = image === img.url;
              const matchesColor =
                selectedColor && img.color === selectedColor;

              return (
                <div
                  key={i}
                  className={`w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer border-2 transition-all overflow-hidden ${
                    isSelected
                      ? "border-orange-500"
                      : matchesColor
                      ? "border-orange-300"
                      : "border-transparent"
                  }`}
                  onClick={() => setImage(img.url)}
                >
                  <img
                    src={img.url}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                </div>
              );
            })}
          </div>
          {/* Main image */}
          <div className="w-full sm:w-[80%]">
            <img src={image} className="w-full sm:max-h-[500px] object-cover" alt="" />
          </div>
        </div>

        {/* PRODUCT INFO */}
        <div className="flex-1">
          <h1 className="font-medium text-2xl my-2">{productData.name}</h1>
          <div className="flex items-center gap-1 mt-2">
            {/* Dynamic star rating */}
            {[1, 2, 3, 4, 5].map((star) => (
              <img
                key={star}
                className="w-3.5"
                src={
                  star <= Math.round(computedAvgRating)
                    ? assets.star_icon
                    : assets.star_dull_icon
                }
                alt=""
              />
            ))}
            <p className="pl-2 text-sm text-gray-500">
              {computedAvgRating > 0 && (
                <span className="font-medium text-gray-700">{computedAvgRating} </span>
              )}
              ({numReviewsDisplay} {numReviewsDisplay === 1 ? "review" : "reviews"})
            </p>
          </div>
          <p className="mt-5 text-3xl font-medium">
            {currency}
            {displayPrice}
          </p>
          <p className="mt-5 text-gray-500 md:w-4/5">
            {productData.description}
          </p>

          {/* ── COLOR SELECTOR ── */}
          {hasColors && (
            <div className="flex flex-col gap-3 my-6">
              <p>
                Select Color:{" "}
                <span className="font-medium">{selectedColor}</span>
              </p>
              <div className="flex gap-3">
                {productData.colors.map((c, i) => {
                  const colorObj =
                    typeof c === "object" ? c : { name: c, hex: "#000" };
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedColor(colorObj.name)}
                      title={colorObj.name}
                      className={`w-9 h-9 rounded-full border-2 transition-all ${
                        selectedColor === colorObj.name
                          ? "border-orange-500 scale-110 shadow-md"
                          : "border-gray-300 hover:border-gray-500"
                      }`}
                      style={{ backgroundColor: colorObj.hex }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* ── SIZE SELECTOR ── */}
          {hasSizes && (
            <div className="flex flex-col gap-4 my-6">
              <p>Select Size</p>
              <div className="flex gap-2">
                {productData.sizes.map((item, i) => (
                  <button
                    className={`border py-2 px-4 bg-gray-100 ${
                      item === size ? "border-orange-500" : ""
                    }`}
                    key={i}
                    onClick={() => setSize(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            className={`px-8 py-3 text-sm mt-4 ${
              isOutOfStock
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-black text-white active:bg-gray-700"
            }`}
            onClick={() => !isOutOfStock && addToCart(productData._id, size, selectedColor)}
            disabled={isOutOfStock}
          >
            {isOutOfStock ? "OUT OF STOCK" : "ADD TO CART"}
          </button>
          {currentStock !== Infinity && currentStock > 0 && currentStock <= 10 && (
            <p className="text-sm text-orange-500 mt-2">
              Only {currentStock} left in stock!
            </p>
          )}
          <hr className="mt-8 sm:w-4/5" />

          <div className="text-sm text-gray-500 mt-5 flex flex-col gap-1">
            <p>100% Original Product.</p>
            <p>Cash on delivery is available on this product.</p>
            <p>Easy return and exchange policy within 7 days.</p>
          </div>
        </div>
      </div>

      {/* ─── DESCRIPTION & REVIEWS TABS ─── */}
      <div className="mt-20">
        <div className="flex">
          <button
            className={`border px-5 py-3 text-sm cursor-pointer ${
              activeTab === "description" ? "font-bold bg-white" : "bg-gray-50 text-gray-500"
            }`}
            onClick={() => setActiveTab("description")}
          >
            Description
          </button>
          <button
            className={`border px-5 py-3 text-sm cursor-pointer ${
              activeTab === "reviews" ? "font-bold bg-white" : "bg-gray-50 text-gray-500"
            }`}
            onClick={() => setActiveTab("reviews")}
          >
            Reviews ({numReviewsDisplay})
          </button>
        </div>

        {/* TAB CONTENT */}
        <div className="border px-6 py-6">
          {activeTab === "description" ? (
            <div className="text-sm text-gray-500">
              <p>{productData.description}</p>
            </div>
          ) : (
            <div>
              {/* ── REVIEW FORM ── */}
              {isAuthenticated ? (
                !userReview || editingReviewId ? (
                  <form onSubmit={handleSubmitReview} className="mb-8 pb-6 border-b">
                    <h3 className="font-medium text-gray-800 mb-4">
                      {editingReviewId ? "Edit Your Review" : "Write a Review"}
                    </h3>

                    {/* Star picker */}
                    <div className="flex items-center gap-1 mb-4">
                      <p className="text-sm text-gray-500 mr-2">Rating:</p>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-0.5"
                        >
                          <svg
                            className={`w-6 h-6 transition-colors ${
                              star <= (hoverRating || reviewRating)
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300 fill-gray-300"
                            }`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      ))}
                      {reviewRating > 0 && (
                        <span className="text-sm text-gray-500 ml-2">
                          {reviewRating}/5
                        </span>
                      )}
                    </div>

                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience with this product..."
                      className="w-full border border-gray-300 rounded p-3 text-sm text-gray-700 resize-none focus:outline-none focus:border-gray-500"
                      rows={4}
                      required
                    />

                    <div className="flex gap-3 mt-3">
                      <button
                        type="submit"
                        disabled={reviewSubmitting}
                        className="bg-black text-white px-6 py-2 text-sm disabled:opacity-50"
                      >
                        {reviewSubmitting
                          ? "Submitting..."
                          : editingReviewId
                          ? "Update Review"
                          : "Submit Review"}
                      </button>
                      {editingReviewId && (
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="border border-gray-300 px-6 py-2 text-sm text-gray-600 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                ) : (
                  <div className="mb-6 pb-4 border-b">
                    <p className="text-sm text-green-600">
                      ✓ You have already reviewed this product.
                    </p>
                  </div>
                )
              ) : (
                <div className="mb-6 pb-4 border-b">
                  <p className="text-sm text-gray-500">
                    Please{" "}
                    <span
                      onClick={() => navigate("/login")}
                      className="text-black font-medium underline cursor-pointer"
                    >
                      login
                    </span>{" "}
                    to write a review.
                  </p>
                </div>
              )}

              {/* ── REVIEWS LIST ── */}
              {reviewsLoading ? (
                <p className="text-sm text-gray-400 py-4">Loading reviews...</p>
              ) : reviews.length === 0 ? (
                <p className="text-sm text-gray-400 py-4">
                  No reviews yet. Be the first to review this product!
                </p>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => {
                    const isOwn =
                      currentUser &&
                      (review.user?._id === currentUser._id ||
                        review.user === currentUser._id);

                    return (
                      <div key={review._id} className="pb-4 border-b last:border-b-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm text-gray-800">
                                {review.user?.name || "User"}
                              </p>
                              {isOwn && (
                                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-0.5 mb-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= review.rating
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-gray-300 fill-gray-300"
                                  }`}
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                              <span className="text-xs text-gray-400 ml-2">
                                {new Date(review.createdAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Edit / Delete for own review */}
                          {isOwn && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditReview(review)}
                                className="text-xs text-gray-500 hover:text-black"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteReview(review._id)}
                                className="text-xs text-red-500 hover:text-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{review.comment}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* DISPLAY ML-POWERED RECOMMENDATIONS */}
      <MLRecommendations productId={productId} limit={5} />
    </div>
  ) : (
    <div className="opacity-0"></div>
  );
};

export default Product;
