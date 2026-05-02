const Navbar = ({ setToken }) => {
  return (
    <div className="flex items-center py-2 px-[4%] justify-between">
      <span className="text-2xl font-bold tracking-widest text-gray-900">IntelliCart <span className="text-sm font-normal tracking-normal text-gray-500">Admin</span></span>
      <button
        onClick={() => setToken("")}
        className="bg-gray-600 text-white px-5 py-5 sm:px-7 sm:py-2 rounded-full text-xs sm:text-sm"
      >
        Logout
      </button>
    </div>
  );
};

export default Navbar;
