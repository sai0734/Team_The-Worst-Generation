import jwtAxios from "../util/jwtUtil";
import { API_SERVER_HOST } from "./todoApi";
import type { CartChangeParam, CartItem } from "../types/cart";

const host = `${API_SERVER_HOST}/api/cart`;

export const getCartItems = async (): Promise<CartItem[]> => {
  const res = await jwtAxios.get(`${host}/items`);

  return res.data;
};

export const postChangeCart = async (
  cartItem: CartChangeParam,
): Promise<CartItem[]> => {
  const res = await jwtAxios.post(`${host}/change`, cartItem);

  return res.data;
};
