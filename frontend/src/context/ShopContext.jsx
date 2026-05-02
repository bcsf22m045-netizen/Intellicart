import { createContext, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { selectAuth } from "../store/slices/authSlice";
import {
  fetchCategories,
  selectCategories,
  selectCategoriesFetched,
} from "../store/slices/categorySlice";
import {
  addToCartAsync,
  updateCartAsync,
  removeFromCartAsync,
  fetchCart,
  mergeGuestCart,
  resetCart,
  selectCartItems,
  selectCartCount,
  selectCartSubtotal,
} from "../store/slices/cartSlice";

export const ShopContext = createContext();

/**
 * ShopContextProvider
 * Manages shopping-related state (products, search)
 * Cart is now in Redux — this context bridges Redux cart with components
 */
const ShopContextProvider = (props) => {
  const currency = "$";
  const delivery_fee = 10;
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [products, setProducts] = useState([]);

  // Legacy token state for backward compatibility
  const [token, setToken] = useState("");

  // Get auth state from Redux
  const { accessToken, isAuthenticated } = useSelector(selectAuth);

  // Cart from Redux
  const cartItems = useSelector(selectCartItems);
  const cartCount = useSelector(selectCartCount);
  const cartSubtotal = useSelector(selectCartSubtotal);

  // Categories from Redux
  const categories = useSelector(selectCategories);
  const categoriesFetched = useSelector(selectCategoriesFetched);

  const navigate = useNavigate();

  // Get the current auth token (prefer Redux, fall back to legacy)
  const getAuthToken = () => {
    return (
      accessToken ||
      token ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token")
    );
  };

  /* ── Cart actions (dispatch Redux thunks) ──────────────────────────── */
  const addToCart = async (itemId, size, color = "") => {
    // Find the product to get snapshot data for guest cart
    const product = products.find((p) => p._id === itemId);

    // Determine the best image for this color
    let productImage = "";
    if (product) {
      if (product.images && product.images.length > 0) {
        const colorImg = color
          ? product.images.find((img) => img.color === color)
          : null;
        productImage = colorImg ? colorImg.url : product.images[0].url;
      } else if (product.image && product.image.length > 0) {
        productImage = product.image[0];
      }
    }

    // Determine price
    let productPrice = product?.basePrice ?? product?.price ?? 0;
    if (product?.variants?.length > 0) {
      const variant = product.variants.find(
        (v) =>
          (!v.size || v.size === size) && (!v.color || v.color === color)
      );
      if (variant?.price) productPrice = variant.price;
    }

    try {
      const result = await dispatch(
        addToCartAsync({
          productId: itemId,
          size,
          color,
          quantity: 1,
          productData: {
            name: product?.name || "",
            image: productImage,
            price: productPrice,
          },
        })
      ).unwrap();
      toast.success("Added to cart!");
    } catch (err) {
      toast.error(err || "Failed to add to cart");
    }
  };

  const getCartCount = () => cartCount;

  const getCartAmount = () => cartSubtotal;

  const updateQuantity = async (productId, size, color, quantity) => {
    try {
      if (quantity <= 0) {
        await dispatch(
          removeFromCartAsync({ productId, size, color })
        ).unwrap();
      } else {
        await dispatch(
          updateCartAsync({ productId, size, color, quantity })
        ).unwrap();
      }
    } catch (err) {
      toast.error(err || "Failed to update cart");
    }
  };

  const removeCartItem = async (productId, size, color) => {
    try {
      await dispatch(
        removeFromCartAsync({ productId, size, color })
      ).unwrap();
    } catch (err) {
      toast.error(err || "Failed to remove item");
    }
  };

  /* ── Fetch products ────────────────────────────────────────────────── */
  const getProductsData = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/product/list");
      if (response.data.success) {
        setProducts(response.data.products);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  // Fetch products on mount
  useEffect(() => {
    getProductsData();
  }, []);

  // Fetch categories on mount (if not already fetched)
  useEffect(() => {
    if (!categoriesFetched) {
      dispatch(fetchCategories());
    }
  }, [dispatch, categoriesFetched]);

  // Sync/merge cart when user logs in
  useEffect(() => {
    if (isAuthenticated && getAuthToken()) {
      dispatch(mergeGuestCart());
    }
  }, [isAuthenticated, accessToken]);

  // Reset cart when logged out
  useEffect(() => {
    if (!isAuthenticated && !getAuthToken()) {
      dispatch(resetCart());
    }
  }, [isAuthenticated]);

  // Legacy token sync
  useEffect(() => {
    if (!token && localStorage.getItem("token")) {
      setToken(localStorage.getItem("token"));
    }
  }, []);

  const value = {
    products,
    currency,
    delivery_fee,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    cartItems,
    addToCart,
    getCartCount,
    updateQuantity,
    removeCartItem,
    getCartAmount,
    navigate,
    backendUrl,
    token,
    setToken,
    // Categories
    categories,
    // Auth integration
    isAuthenticated,
    getAuthToken,
  };

  return (
    <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>
  );
};

export default ShopContextProvider;
