import React, { useContext, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";
import { placeOrder, selectOrderPlacing } from "../store/slices/orderSlice";
import { clearCartAsync, selectCartItems, fetchCart } from "../store/slices/cartSlice";

const PlaceOrder = () => {
  const { navigate, isAuthenticated } = useContext(ShopContext);
  const dispatch = useDispatch();
  const location = useLocation();
  const cartItems = useSelector(selectCartItems);
  const placing = useSelector(selectOrderPlacing);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  });

  // Re-fetch cart on mount to ensure freshness (e.g. chatbot-added items)
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated]);

  // Pre-fill shipping form if coming from chatbot
  useEffect(() => {
    if (location.state?.fromChatbot && location.state?.shippingData) {
      const s = location.state.shippingData;
      setFormData((prev) => ({
        ...prev,
        fullName: s.fullName || prev.fullName,
        email: s.email || prev.email,
        phone: s.phone || prev.phone,
        address: s.address || prev.address,
        city: s.city || prev.city,
        postalCode: s.postalCode || prev.postalCode,
      }));
    }
  }, [location.state]);

  const onChangeHandler = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error("Please login to place an order");
      navigate("/login");
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    // Validate form
    const { fullName, email, phone, address, city, postalCode } = formData;
    if (!fullName || !email || !phone || !address || !city || !postalCode) {
      toast.error("Please fill in all shipping fields");
      return;
    }

    // Build order items from cart
    const orderItems = cartItems.map((item) => ({
      productId: item.productId,
      size: item.size || "",
      color: item.color || "",
      quantity: item.quantity,
    }));

    try {
      const result = await dispatch(
        placeOrder({
          items: orderItems,
          shippingAddress: formData,
        })
      ).unwrap();

      // Clear cart
      dispatch(clearCartAsync());

      toast.success("Order placed successfully!");
      navigate("/order-confirmation");
    } catch (err) {
      toast.error(err || "Failed to place order");
    }
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t"
    >
      {/* LEFT SIDE — SHIPPING */}
      <div className="flex flex-col gap-4 w-full sm:max-w-[480px]">
        <div className="text-xl sm:text-2xl my-3">
          <Title text1={"DELIVERY"} text2={"INFORMATION"} />
        </div>

        <input
          type="text"
          placeholder="Full Name"
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          onChange={onChangeHandler}
          name="fullName"
          value={formData.fullName}
          required
        />
        <input
          type="email"
          placeholder="Email Address"
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          onChange={onChangeHandler}
          name="email"
          value={formData.email}
          required
        />
        <input
          type="tel"
          placeholder="Phone Number"
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          onChange={onChangeHandler}
          name="phone"
          value={formData.phone}
          required
        />
        <input
          type="text"
          placeholder="Street Address"
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          onChange={onChangeHandler}
          name="address"
          value={formData.address}
          required
        />
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="City"
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            onChange={onChangeHandler}
            name="city"
            value={formData.city}
            required
          />
          <input
            type="text"
            placeholder="Postal Code"
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            onChange={onChangeHandler}
            name="postalCode"
            value={formData.postalCode}
            required
          />
        </div>
      </div>

      {/* RIGHT SIDE — SUMMARY */}
      <div className="mt-8">
        <div className="mt-8 min-w-80">
          <CartTotal />
        </div>

        <div className="mt-12">
          <Title text1={"PAYMENT"} text2={"METHOD"} />

          {/* COD ONLY */}
          <div className="flex items-center gap-3 border p-3 px-4 mt-4 bg-gray-50 rounded">
            <p className="min-w-3.5 h-3.5 border rounded-full bg-green-400"></p>
            <p className="text-gray-700 text-sm font-medium">
              CASH ON DELIVERY
            </p>
          </div>
          <p className="text-xs text-gray-400 mt-2 ml-1">
            Only Cash on Delivery is available at the moment.
          </p>

          <div className="w-full text-end mt-8">
            <button
              className="bg-black text-white px-16 py-3 text-sm disabled:opacity-50"
              type="submit"
              disabled={placing}
            >
              {placing ? "PLACING ORDER..." : "PLACE ORDER"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
