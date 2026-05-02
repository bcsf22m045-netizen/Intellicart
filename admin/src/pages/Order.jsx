import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { currency } from "../App";
import {
  fetchAdminOrders,
  updateOrderStatus,
  selectAdminOrders,
  selectAdminOrdersLoading,
  selectAdminOrderUpdating,
} from "../store/slices/adminOrderSlice";

const statusColors = {
  Pending: "text-yellow-600 bg-yellow-50",
  Confirmed: "text-blue-600 bg-blue-50",
  Shipped: "text-purple-600 bg-purple-50",
  Delivered: "text-green-600 bg-green-50",
  Cancelled: "text-red-600 bg-red-50",
};

const Order = ({ token }) => {
  const dispatch = useDispatch();
  const orders = useSelector(selectAdminOrders);
  const loading = useSelector(selectAdminOrdersLoading);
  const updating = useSelector(selectAdminOrderUpdating);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    if (token) {
      dispatch(fetchAdminOrders());
    }
  }, [token, dispatch]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await dispatch(updateOrderStatus({ orderId, status: newStatus })).unwrap();
      toast.success("Order status updated");
    } catch (err) {
      toast.error(err || "Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-500">Loading orders...</div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">Orders Management</h3>
      <p className="text-sm text-gray-500 mb-4">
        Total orders: <span className="font-medium">{orders.length}</span>
      </p>

      {orders.length === 0 ? (
        <div className="text-center py-20 text-gray-500">No orders yet</div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Order Row */}
              <div
                className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr_1fr_1fr] gap-4 items-center p-4 md:p-5 text-sm cursor-pointer hover:bg-gray-50"
                onClick={() =>
                  setExpandedOrder(
                    expandedOrder === order._id ? null : order._id
                  )
                }
              >
                {/* Order ID + Date */}
                <div>
                  <p className="font-mono text-xs text-gray-400">
                    #{order._id.slice(-8)}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Customer Info */}
                <div>
                  <p className="font-medium text-gray-800">
                    {order.shippingAddress?.fullName || "N/A"}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {order.shippingAddress?.phone || "N/A"}
                  </p>
                  <p className="text-gray-400 text-xs truncate">
                    {order.shippingAddress?.address},{" "}
                    {order.shippingAddress?.city}
                  </p>
                </div>

                {/* Items Summary */}
                <div>
                  <p className="text-gray-600">
                    {order.items?.length || 0} item(s)
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Payment: {order.isPaid ? "Paid" : "Pending"}
                  </p>
                </div>

                {/* Total */}
                <div>
                  <p className="font-semibold text-gray-800">
                    {currency}
                    {order.totalPrice}
                  </p>
                  <p className="text-xs text-gray-400">COD</p>
                </div>

                {/* Status Selector */}
                <div onClick={(e) => e.stopPropagation()}>
                  <select
                    value={order.orderStatus}
                    className={`px-3 py-1.5 rounded text-sm font-medium border-0 cursor-pointer ${
                      statusColors[order.orderStatus] || "text-gray-600 bg-gray-50"
                    }`}
                    onChange={(e) =>
                      handleStatusChange(order._id, e.target.value)
                    }
                    disabled={updating === order._id}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedOrder === order._id && (
                <div className="border-t bg-gray-50 p-4 md:p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Items */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">
                        Order Items
                      </h4>
                      <div className="space-y-2">
                        {order.items?.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 text-sm bg-white p-2 rounded"
                          >
                            {item.image && (
                              <img
                                src={item.image}
                                className="w-10 h-10 object-cover rounded"
                                alt=""
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-gray-700">
                                {item.name}
                              </p>
                              <div className="flex gap-2 text-xs text-gray-500">
                                <span>
                                  {currency}
                                  {item.price} × {item.quantity}
                                </span>
                                {item.size && <span>Size: {item.size}</span>}
                                {item.color && <span>Color: {item.color}</span>}
                              </div>
                            </div>
                            <p className="font-medium text-gray-800">
                              {currency}
                              {(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">
                        Shipping Details
                      </h4>
                      <div className="bg-white p-3 rounded text-sm text-gray-600 space-y-1">
                        <p className="font-medium text-gray-800">
                          {order.shippingAddress?.fullName}
                        </p>
                        <p>{order.shippingAddress?.phone}</p>
                        {order.shippingAddress?.email && (
                          <p>{order.shippingAddress.email}</p>
                        )}
                        <p>{order.shippingAddress?.address}</p>
                        <p>
                          {order.shippingAddress?.city},{" "}
                          {order.shippingAddress?.postalCode}
                        </p>
                      </div>

                      <h4 className="font-medium text-gray-700 mt-4 mb-2">
                        Order Info
                      </h4>
                      <div className="bg-white p-3 rounded text-sm text-gray-600 space-y-1">
                        <p>
                          Customer:{" "}
                          <span className="text-gray-800">
                            {order.user?.name || "N/A"} ({order.user?.email || "N/A"})
                          </span>
                        </p>
                        <p>
                          Payment Method:{" "}
                          <span className="text-gray-800">
                            {order.paymentMethod}
                          </span>
                        </p>
                        <p>
                          Payment Status:{" "}
                          <span
                            className={
                              order.isPaid ? "text-green-600" : "text-orange-500"
                            }
                          >
                            {order.isPaid ? "Paid" : "Pending"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Order;
