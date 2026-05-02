import { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { Link } from "react-router-dom";

const ProductItem = ({ id, image, name, price }) => {
  const { currency } = useContext(ShopContext);
  return (
    <Link
      to={`/product/${id}`}
      className="text-gray-700 cursor-pointer group flex flex-col h-full"
    >
      <div className="overflow-hidden aspect-[3/4] bg-gray-100">
        <img
          src={image[0]}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition ease-in-out"
        />
      </div>
      <div className="flex flex-col flex-grow pt-3">
        <p className="pb-1 text-sm line-clamp-2 flex-grow">{name}</p>
        <p className="text-sm font-medium">
          {currency}
          {price}
        </p>
      </div>
    </Link>
  );
};

export default ProductItem;
