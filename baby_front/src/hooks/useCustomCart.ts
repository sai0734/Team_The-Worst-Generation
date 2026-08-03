import { useDispatch, useSelector } from "react-redux";
import { getCartItemsAsync, postChangeCartAsync } from "../slices/cartSlice";
import type { AppDispatch, RootState } from "../store";
import type { CartChangeParam } from "../types/cart";

const useCustomCart = () => {
  const cartItems = useSelector((state: RootState) => state.cartSlice);

  const dispatch = useDispatch<AppDispatch>();

  const refreshCart = () => {
    dispatch(getCartItemsAsync());
  };

  const changeCart = (param: CartChangeParam) => {
    dispatch(postChangeCartAsync(param));
  };

  return { cartItems, refreshCart, changeCart };
};

export default useCustomCart;
