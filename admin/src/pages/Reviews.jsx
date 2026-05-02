import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import {
  fetchAdminReviews,
  adminDeleteReview,
  selectAdminReviews,
  selectAdminReviewsLoading,
  selectAdminReviewDeleting,
} from "../store/slices/adminReviewSlice";

const starDisplay = (rating) => {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${
            star <= rating
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-300 fill-gray-300"
          }`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

const Reviews = ({ token }) => {
  const dispatch = useDispatch();
  const reviews = useSelector(selectAdminReviews);
  const loading = useSelector(selectAdminReviewsLoading);
  const deleting = useSelector(selectAdminReviewDeleting);

  useEffect(() => {
    if (token) {
      dispatch(fetchAdminReviews());
    }
  }, [token, dispatch]);

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Delete this review? This action cannot be undone."))
      return;
    try {
      await dispatch(adminDeleteReview(reviewId)).unwrap();
      toast.success("Review deleted");
    } catch (err) {
      toast.error(err || "Failed to delete review");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-500">Loading reviews...</div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Reviews Management
      </h2>

      {reviews.length === 0 ? (
        <p className="text-gray-400 text-center py-10">No reviews yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-600">
                <th className="py-3 px-4 font-medium">Review ID</th>
                <th className="py-3 px-4 font-medium">Product</th>
                <th className="py-3 px-4 font-medium">User</th>
                <th className="py-3 px-4 font-medium">Rating</th>
                <th className="py-3 px-4 font-medium">Comment</th>
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr
                  key={review._id}
                  className="border-b hover:bg-gray-50 transition-colors"
                >
                  {/* ID */}
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">
                    {review._id.slice(-8)}
                  </td>

                  {/* Product */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {review.product?.images?.[0]?.url && (
                        <img
                          src={review.product.images[0].url}
                          alt=""
                          className="w-8 h-8 object-cover rounded"
                        />
                      )}
                      <span className="text-gray-700 truncate max-w-[150px]">
                        {review.product?.name || "Deleted Product"}
                      </span>
                    </div>
                  </td>

                  {/* User */}
                  <td className="py-3 px-4">
                    <p className="text-gray-700">
                      {review.user?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {review.user?.email || ""}
                    </p>
                  </td>

                  {/* Rating */}
                  <td className="py-3 px-4">{starDisplay(review.rating)}</td>

                  {/* Comment */}
                  <td className="py-3 px-4">
                    <p
                      className="text-gray-600 truncate max-w-[200px]"
                      title={review.comment}
                    >
                      {review.comment}
                    </p>
                  </td>

                  {/* Date */}
                  <td className="py-3 px-4 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(review.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>

                  {/* Delete */}
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleDelete(review._id)}
                      disabled={deleting === review._id}
                      className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                    >
                      {deleting === review._id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4">
        Total: {reviews.length} review{reviews.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
};

export default Reviews;
