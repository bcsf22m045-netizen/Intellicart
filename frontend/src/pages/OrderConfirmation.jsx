import { useContext } from "react";
import { useSelector } from "react-redux";
import { ShopContext } from "../context/ShopContext";
import { selectCurrentOrder } from "../store/slices/orderSlice";

const OrderConfirmation = () => {
  const { navigate, currency } = useContext(ShopContext);
  const order = useSelector(selectCurrentOrder);

  return (
    <div className="border-t pt-16 min-h-[60vh]">
      <div className="max-w-lg mx-auto text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          Order Placed Successfully!
        </h1>
        <p className="text-gray-500 mb-6">
          Thank you for your order. You will receive a confirmation soon.
        </p>

        {order && (
          <div className="bg-gray-50 rounded-lg p-6 text-left mb-8">
            <h3 className="font-medium text-gray-800 mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Order ID:</span>
                <span className="font-mono text-xs">{order._id}</span>
              </div>
              <div className="flex justify-between">
                <span>Items:</span>
                <span>{order.items?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Total:</span>
                <span className="font-medium text-gray-800">
                  {currency}
                  {order.totalPrice}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Payment:</span>
                <span>Cash on Delivery</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-orange-500 font-medium">
                  {order.orderStatus}
                </span>
              </div>
            </div>

            {order.shippingAddress && (
              <div className="mt-4 pt-4 border-t text-sm text-gray-600">
                <p className="font-medium text-gray-800 mb-1">Ship to:</p>
                <p>{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.address}</p>
                <p>
                  {order.shippingAddress.city},{" "}
                  {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.phone}</p>
                {order.shippingAddress.email && (
                  <p>{order.shippingAddress.email}</p>
                )}
              </div>
            )}
          </div>
        )}

        <p className="text-sm text-gray-500 mb-6">
          A confirmation email has been sent to{" "}
          <span className="font-medium text-gray-700">
            {order?.shippingAddress?.email || "your email"}
          </span>
        </p>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate("/orders")}
            className="bg-black text-white px-8 py-3 text-sm"
          >
            VIEW MY ORDERS
          </button>
          <button
            onClick={() => navigate("/collection")}
            className="border border-gray-300 text-gray-700 px-8 py-3 text-sm hover:bg-gray-50"
          >
            CONTINUE SHOPPING
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
