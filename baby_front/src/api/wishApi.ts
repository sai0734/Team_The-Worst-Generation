import jwtAxios from "../util/jwtUtil";
import axios from "axios";

const API_SERVER_HOST = "http://localhost:8080";
const prefix = `${API_SERVER_HOST}/api/market/wish`;

// WishDTO
export interface Wish {
  wno?: number;
  itemNo: number;
  memberEmail?: string;
  regTime?: string;
}

export const getMyWishList = async (): Promise<Wish[]> => {
  const res = await jwtAxios.get(`${prefix}/`);
  return res.data;
};

export const toggleWish = async (itemNo: number): Promise<boolean> => {
  const res = await jwtAxios.post(`${prefix}/${itemNo}`);
  return res.data.wished;
};

export const getWishCount = async (itemNo: number): Promise<number> => {
  const res = await axios.get(`${prefix}/${itemNo}/count`);
  return res.data.count;
};
