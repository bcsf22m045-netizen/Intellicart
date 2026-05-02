import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { assets } from "../assets/assets";
import { useContext, useState, useEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import { logoutUser, selectAuth, selectUser } from "../store/slices/authSlice";
import { selectCartCount, resetCart } from "../store/slices/cartSlice";
import { resetOrders } from "../store/slices/orderSlice";
import {
  fetchCategories,
  selectCategories,
  selectCategoriesLoading,
  selectCategoriesFetched,
} from "../store/slices/categorySlice";

const Navbar = () => {
  const [visible, setVisible] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Auth state
  const { isAuthenticated } = useSelector(selectAuth);
  const user = useSelector(selectUser);
  const cartCount = useSelector(selectCartCount);

  // Categories from Redux
  const categories = useSelector(selectCategories);
  const categoriesLoading = useSelector(selectCategoriesLoading);
  const categoriesFetched = useSelector(selectCategoriesFetched);

  const { setShowSearch, setToken } = useContext(ShopContext);

  // Fetch categories globally (only once)
  useEffect(() => {
    if (!categoriesFetched) {
      dispatch(fetchCategories());
    }
  }, [dispatch, categoriesFetched]);

  // Determine which category is "active" from URL query param
  const searchParams = new URLSearchParams(location.search);
  const activeCategoryParam = searchParams.get("category")?.toLowerCase() || "";
  const isCollectionPage = location.pathname === "/collection";

  // Handle logout
  const handleLogout = async () => {
    await dispatch(logoutUser());
    dispatch(resetCart());
    dispatch(resetOrders());
    setToken("");
    navigate("/login");
  };

  // Handle profile icon click
  const handleProfileClick = () => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  };

  // Navigate to collection with category filter
  const handleCategoryClick = (categoryName) => {
    setVisible(false);
    navigate(`/collection?category=${encodeURIComponent(categoryName.toLowerCase())}`);
  };

  // Check if a category nav item is active
  const isCategoryActive = (categoryName) => {
    return isCollectionPage && activeCategoryParam === categoryName.toLowerCase();
  };

  return (
    <div className="flex items-center justify-between py-5 font-medium">
      <Link to={"/"}>
        <span className="text-3xl font-bold tracking-widest text-gray-900">INTELLICART</span>
      </Link>

      {/* ─── DESKTOP NAV ─── */}
      <ul className="hidden sm:flex items-center gap-5 text-sm text-gray-700">
        {/* HOME */}
        <NavLink to="/" className="flex flex-col items-center gap-1">
          <p>HOME</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
        </NavLink>

        {/* COLLECTION */}
        <NavLink
          to="/collection"
          className={() => "flex flex-col items-center gap-1"}
        >
          {() => {
            const active = isCollectionPage && !activeCategoryParam;
            return (
              <>
                <p>COLLECTION</p>
                <hr
                  className={`w-2/4 border-none h-[1.5px] bg-gray-700 ${
                    active ? "" : "hidden"
                  }`}
                />
              </>
            );
          }}
        </NavLink>

        {/* DYNAMIC CATEGORIES */}
        {categoriesLoading ? (
          <li className="text-gray-400 text-xs animate-pulse">Loading…</li>
        ) : (
          categories.map((cat) => (
            <li
              key={cat._id}
              onClick={() => handleCategoryClick(cat.name)}
              className="flex flex-col items-center gap-1 cursor-pointer group"
            >
              <p
                className={`transition-colors ${
                  isCategoryActive(cat.name)
                    ? "text-black font-semibold"
                    : "text-gray-700 group-hover:text-black"
                }`}
              >
                {cat.name.toUpperCase()}
              </p>
              <hr
                className={`w-2/4 border-none h-[1.5px] bg-gray-700 ${
                  isCategoryActive(cat.name) ? "" : "hidden"
                }`}
              />
            </li>
          ))
        )}
      </ul>

      <div className="flex items-center gap-6">
        <img
          src={assets.search_icon}
          className="w-5 cursor-pointer"
          onClick={() => setShowSearch(true)}
          alt=""
        />

        <div className="group relative">
          {/* Profile Icon or User Avatar */}
          {isAuthenticated && user?.avatar ? (
            <img
              src={user.avatar}
              className="w-8 h-8 rounded-full cursor-pointer object-cover border border-gray-200"
              alt={user.name}
            />
          ) : (
            <img
              src={assets.profile_icon}
              className="w-5 cursor-pointer"
              alt=""
              onClick={handleProfileClick}
            />
          )}
          
          {/* DROPDOWN MENU */}
          {isAuthenticated && (
            <div className="group-hover:block hidden absolute dropdown-menu right-0 pt-4 z-50">
              <div className="flex flex-col gap-2 w-40 py-3 px-5 bg-slate-100 text-gray-500 rounded shadow-lg">
                {/* User Info */}
                <div className="border-b border-gray-200 pb-2 mb-1">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user?.email || ''}
                  </p>
                </div>
                
                <p className="cursor-pointer hover:text-black transition-colors">
                  My Profile
                </p>
                <p
                  onClick={() => navigate("/orders")}
                  className="cursor-pointer hover:text-black transition-colors"
                >
                  Orders
                </p>
                <p 
                  onClick={handleLogout} 
                  className="cursor-pointer transition-colors text-red-500 hover:text-red-700"
                >
                  Logout
                </p>
              </div>
            </div>
          )}
        </div>

        <Link to="/cart" className="relative">
          <img src={assets.cart_icon} className="w-5 min-w-5" alt="" />
          <p className="absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-black text-white aspect-square rounded-full text-[8px]">
            {cartCount}
          </p>
        </Link>
        <img
          src={assets.menu_icon}
          className="w-5 cursor-pointer sm:hidden"
          onClick={() => setVisible(true)}
          alt=""
        />
      </div>

      {/* SIDEBAR MENU FOR SMALL SCREEN */}
      <div
        className={`absolute top-0 right-0 bottom-0 overflow-hidden bg-white transition-all z-50 ${
          visible ? "w-full" : "w-0"
        }`}
      >
        <div className="flex flex-col text-gray-600">
          <div
            onClick={() => setVisible(false)}
            className="flex items-center gap-4 p-3 cursor-pointer"
          >
            <img src={assets.dropdown_icon} className="h-4 rotate-180" alt="" />
            <p>Back</p>
          </div>
          
          {/* Show user info on mobile if logged in */}
          {isAuthenticated && user && (
            <div className="py-3 px-6 border-b bg-gray-50">
              <p className="font-medium text-gray-800">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          )}
          
          <NavLink
            onClick={() => setVisible(false)}
            to={"/"}
            className="py-2 pl-6 border"
          >
            HOME
          </NavLink>
          <NavLink
            onClick={() => setVisible(false)}
            to={"/collection"}
            className="py-2 pl-6 border"
          >
            COLLECTION
          </NavLink>

          {/* Dynamic categories on mobile */}
          {categoriesLoading ? (
            <div className="py-2 pl-6 border text-gray-400 text-xs animate-pulse">
              Loading categories…
            </div>
          ) : (
            categories.map((cat) => (
              <div
                key={cat._id}
                onClick={() => handleCategoryClick(cat.name)}
                className={`py-2 pl-6 border cursor-pointer ${
                  isCategoryActive(cat.name)
                    ? "bg-gray-100 font-medium text-black"
                    : ""
                }`}
              >
                {cat.name.toUpperCase()}
              </div>
            ))
          )}
          
          {/* Auth links on mobile */}
          {isAuthenticated ? (
            <>
              <NavLink
                onClick={() => setVisible(false)}
                to={"/orders"}
                className="py-2 pl-6 border"
              >
                MY ORDERS
              </NavLink>
              <button
                onClick={() => {
                  setVisible(false);
                  handleLogout();
                }}
                className="py-2 pl-6 border text-left text-red-500"
              >
                LOGOUT
              </button>
            </>
          ) : (
            <NavLink
              onClick={() => setVisible(false)}
              to={"/login"}
              className="py-2 pl-6 border"
            >
              LOGIN
            </NavLink>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
