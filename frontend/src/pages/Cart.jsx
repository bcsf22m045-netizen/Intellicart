import { useContext, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import CartTotal from "../components/CartTotal";
import { selectCartItems, fetchCart } from "../store/slices/cartSlice";

const Cart = () => {
  const { products, currency, updateQuantity, removeCartItem, navigate, isAuthenticated } =
    useContext(ShopContext);
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);

  // Re-fetch cart from server on mount to ensure freshness
  // (e.g. after chatbot adds items directly via backend)
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated]);

  // Find product data for a cart item
  const getProduct = (productId) =>
    products.find((p) => p._id === productId);

  // Get the best image for a cart item
  const getCartImage = (item) => {
    // If the server enriched item already has an image, use it
    if (item.image) return item.image;
    const product = getProduct(item.productId);
    if (!product) return "";
    if (item.color && product.images) {
      const colorImg = product.images.find((img) => img.color === item.color);
      if (colorImg) return colorImg.url;
    }
    if (product.images && product.images.length > 0) return product.images[0].url;
    if (product.image && product.image.length > 0) return product.image[0];
    return "";
  };

  // Get color hex from product
  const getColorHex = (item) => {
    if (!item.color) return null;
    const product = getProduct(item.productId);
    if (!product || !product.colors) return null;
    const colorObj = product.colors.find(
      (c) => (typeof c === "object" ? c.name : c) === item.color
    );
    return colorObj && typeof colorObj === "object" ? colorObj.hex : null;
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    navigate("/place-order");
  };

  return (
    <div className="border-t pt-14">
      <div className="text-2xl mb-3">
        <Title text1={"YOUR"} text2={"CART"} />
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-xl mb-4">Your cart is empty</p>
          <button
            onClick={() => navigate("/collection")}
            className="bg-black text-white px-8 py-3 text-sm"
          >
            CONTINUE SHOPPING
          </button>
        </div>
      ) : (
        <>
          <div>
            {cartItems.map((item, i) => {
              const product = getProduct(item.productId);
              const displayName = item.name || product?.name || "Product";
              const displayPrice = item.price || product?.price || product?.basePrice || 0;
              const colorHex = getColorHex(item);
              const stockAvailable = item.stockAvailable;

              return (
                <div
                  className="py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4"
                  key={`${item.productId}_${item.size}_${item.color}_${i}`}
                >
                  <div className="flex items-start gap-6">
                    <img
                      src={getCartImage(item)}
                      className="w-16 sm:w-20"
                      alt=""
                    />
                    <div>
                      <p className="text-xs sm:text-lg font-medium">
                        {displayName}
                      </p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <p>
                          {currency}
                          {displayPrice}
                        </p>
                        {item.size && (
                          <p className="px-2 sm:px-3 sm:py-1 border bg-slate-50 text-sm">
                            {item.size}
                          </p>
                        )}
                        {item.color && (
                          <p className="px-2 sm:px-3 sm:py-1 border bg-slate-50 text-sm flex items-center gap-1.5">
                            {colorHex && (
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-gray-300 inline-block"
                                style={{ backgroundColor: colorHex }}
                              />
                            )}
                            {item.color}
                          </p>
                        )}
                      </div>
                      {stockAvailable !== undefined && stockAvailable <= 5 && (
                        <p className="text-xs text-orange-500 mt-1">
                          {stockAvailable === 0
                            ? "Out of stock"
                            : `Only ${stockAvailable} left`}
                        </p>
                      )}
                    </div>
                  </div>

                  <input
                    className="border max-w-10 sm:max-w-20 px-1 sm:px-2 py-1"
                    type="number"
                    min={1}
                    max={stockAvailable || 999}
                    value={item.quantity}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val > 0) {
                        updateQuantity(
                          item.productId,
                          item.size || "",
                          item.color || "",
                          val
                        );
                      }
                    }}
                  />
                  <img
                    src={assets.bin_icon}
                    className="w-4 mr-4 sm:w-5 cursor-pointer"
                    alt="Remove"
                    onClick={() =>
                      removeCartItem(
                        item.productId,
                        item.size || "",
                        item.color || ""
                      )
                    }
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-end my-20">
            <div className="w-full sm:w-[450px]">
              <CartTotal />
              <div className="w-full text-end">
                <button
                  className="bg-black text-white text-sm my-8 px-8 py-3"
                  onClick={handleCheckout}
                >
                  PROCEED TO CHECKOUT
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
