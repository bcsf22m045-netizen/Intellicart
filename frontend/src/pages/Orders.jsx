import { useContext, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import {
  fetchMyOrders,
  selectMyOrders,
  selectOrderLoading,
} from "../store/slices/orderSlice";

const statusColor = {
  Pending: "bg-yellow-400",
  Confirmed: "bg-blue-400",
  Shipped: "bg-purple-500",
  Delivered: "bg-green-500",
  Cancelled: "bg-red-500",
};

const Orders = () => {
  const { currency } = useContext(ShopContext);
  const dispatch = useDispatch();
  const orders = useSelector(selectMyOrders);
  const loading = useSelector(selectOrderLoading);

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  return (
    <div className="border-t pt-16">
      <div className="text-2xl">
        <Title text1={"MY"} text2={"ORDERS"} />
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-xl">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-6 mt-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className="border rounded-lg p-5 hover:shadow-sm transition-shadow"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b">
                <div className="text-sm text-gray-500">
                  <span className="font-medium text-gray-700">Order ID: </span>
                  <span className="font-mono text-xs">{order._id}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        statusColor[order.orderStatus] || "bg-gray-400"
                      }`}
                    ></span>
                    <span className="font-medium">{order.orderStatus}</span>
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3">
                {order.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 text-sm"
                  >
                    <img
                      src={item.image}
                      className="w-14 h-14 object-cover rounded border"
                      alt={item.name}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <div className="flex items-center gap-3 text-gray-500 mt-0.5">
                        <span>
                          {currency}
                          {item.price}
                        </span>
                        <span>×{item.quantity}</span>
                        {item.size && (
                          <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                            {item.size}
                          </span>
                        )}
                        {item.color && (
                          <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                            {item.color}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 pt-3 border-t text-sm">
                <div className="text-gray-500">
                  <span>Ship to: </span>
                  <span className="text-gray-700">
                    {order.shippingAddress?.fullName},{" "}
                    {order.shippingAddress?.city}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-2 sm:mt-0">
                  <span className="text-gray-500">
                    Payment: {order.isPaid ? "Paid" : "Pending"}
                  </span>
                  <span className="font-semibold text-gray-800 text-base">
                    {currency}
                    {order.totalPrice}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
