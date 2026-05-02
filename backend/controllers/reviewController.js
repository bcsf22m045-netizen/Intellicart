import reviewModel from "../models/reviewModel.js";
import productModel from "../models/productModel.js";

/* ── Helper: recalculate product rating stats ────────────────────────── */
const recalculateProductRating = async (productId) => {
  const stats = await reviewModel.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: "$product",
        numReviews: { $sum: 1 },
        averageRating: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    await productModel.findByIdAndUpdate(productId, {
      numReviews: stats[0].numReviews,
      averageRating: Math.round(stats[0].averageRating * 10) / 10, // 1 decimal
    });
  } else {
    await productModel.findByIdAndUpdate(productId, {
      numReviews: 0,
      averageRating: 0,
    });
  }
};

/* ────────────────────────────────────────────────────────────────────── */
/*  GET /api/reviews/product/:productId — get all reviews for a product  */
/* ────────────────────────────────────────────────────────────────────── */
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await reviewModel
      .find({ product: productId })
      .populate("user", "name email avatar")
      .sort({ createdAt: -1 });

    res.json({ success: true, reviews });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

/* ────────────────────────────────────────────────────────────────────── */
/*  POST /api/reviews/:productId — create a review (auth required)       */
/* ────────────────────────────────────────────────────────────────────── */
export const createReview = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const { productId } = req.params;
    const { rating, comment } = req.body;

    // Validate
    if (!rating || rating < 1 || rating > 5) {
      return res.json({ success: false, message: "Rating must be between 1 and 5" });
    }
    if (!comment || !comment.trim()) {
      return res.json({ success: false, message: "Comment is required" });
    }

    // Check product exists
    const product = await productModel.findById(productId);
    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    // Check for existing review
    const existingReview = await reviewModel.findOne({
      user: userId,
      product: productId,
    });
    if (existingReview) {
      return res.json({
        success: false,
        message: "You have already reviewed this product. Please edit your existing review.",
      });
    }

    const review = new reviewModel({
      user: userId,
      product: productId,
      rating: Number(rating),
      comment: comment.trim(),
    });

    await review.save();

    // Recalculate product rating
    await recalculateProductRating(product._id);

    // Populate user for response
    const populated = await reviewModel
      .findById(review._id)
      .populate("user", "name email avatar");

    res.json({
      success: true,
      message: "Review submitted successfully!",
      review: populated,
    });
  } catch (error) {
    // Handle duplicate key error (race condition safety)
    if (error.code === 11000) {
      return res.json({
        success: false,
        message: "You have already reviewed this product.",
      });
    }
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

/* ────────────────────────────────────────────────────────────────────── */
/*  PUT /api/reviews/:reviewId — update own review (auth required)       */
/* ────────────────────────────────────────────────────────────────────── */
export const updateReview = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    // Validate
    if (rating && (rating < 1 || rating > 5)) {
      return res.json({ success: false, message: "Rating must be between 1 and 5" });
    }

    const review = await reviewModel.findById(reviewId);
    if (!review) {
      return res.json({ success: false, message: "Review not found" });
    }

    // Only the author can edit
    if (review.user.toString() !== userId) {
      return res.json({ success: false, message: "Not authorized to edit this review" });
    }

    if (rating) review.rating = Number(rating);
    if (comment && comment.trim()) review.comment = comment.trim();

    await review.save();

    // Recalculate product rating
    await recalculateProductRating(review.product);

    const populated = await reviewModel
      .findById(review._id)
      .populate("user", "name email avatar");

    res.json({
      success: true,
      message: "Review updated successfully!",
      review: populated,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

/* ────────────────────────────────────────────────────────────────────── */
/*  DELETE /api/reviews/:reviewId — delete own review (auth required)    */
/* ────────────────────────────────────────────────────────────────────── */
export const deleteReview = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const { reviewId } = req.params;

    const review = await reviewModel.findById(reviewId);
    if (!review) {
      return res.json({ success: false, message: "Review not found" });
    }

    // Only the author can delete
    if (review.user.toString() !== userId) {
      return res.json({ success: false, message: "Not authorized to delete this review" });
    }

    const productId = review.product;
    await reviewModel.findByIdAndDelete(reviewId);

    // Recalculate product rating
    await recalculateProductRating(productId);

    res.json({ success: true, message: "Review deleted successfully!" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

/* ────────────────────────────────────────────────────────────────────── */
/*  GET /api/admin/reviews — all reviews (admin)                         */
/* ────────────────────────────────────────────────────────────────────── */
export const getAllReviews = async (req, res) => {
  try {
    const reviews = await reviewModel
      .find()
      .populate("user", "name email")
      .populate("product", "name images")
      .sort({ createdAt: -1 });

    res.json({ success: true, reviews });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

/* ────────────────────────────────────────────────────────────────────── */
/*  DELETE /api/admin/review/:id — admin delete any review               */
/* ────────────────────────────────────────────────────────────────────── */
export const adminDeleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await reviewModel.findById(id);
    if (!review) {
      return res.json({ success: false, message: "Review not found" });
    }

    const productId = review.product;
    await reviewModel.findByIdAndDelete(id);

    // Recalculate product rating
    await recalculateProductRating(productId);

    res.json({ success: true, message: "Review deleted by admin" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
