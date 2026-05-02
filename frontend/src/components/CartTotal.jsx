import { useContext } from "react";
import { useSelector } from "react-redux";
import { ShopContext } from "../context/ShopContext";
import { selectCartSubtotal } from "../store/slices/cartSlice";
import Title from "./Title";

const CartTotal = () => {
  const { currency, delivery_fee } = useContext(ShopContext);
  const subtotal = useSelector(selectCartSubtotal);

  return (
    <div className="w-full ">
      <div className="text-2xl">
        <Title text1={"CART"} text2={"TOTAL"} />
      </div>

      <div className="flex flex-col gap-2 mt-2 text-sm">
        <div className="flex justify-between">
          <p>Subtotal</p>
          <p>
            {currency} {subtotal.toFixed(2)}
          </p>
        </div>
        <hr />
        <div className="flex justify-between">
          <p>Shipping Fee</p>
          <p>
            {currency} {delivery_fee.toFixed(2)}
          </p>
        </div>
        <hr />
        <div className="flex justify-between">
          <b>Total</b>
          <b>
            {currency}{" "}
            {subtotal === 0 ? "0.00" : (subtotal + delivery_fee).toFixed(2)}
          </b>
        </div>
      </div>
    </div>
  );
};

export default CartTotal;
