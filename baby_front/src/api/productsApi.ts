import { API_SERVER_HOST } from "./todoApi";
import jwtAxios from "../util/jwtUtil";
import type { PageRequestParam, PageResponse } from "../types/page";
import type { Product } from "../types/product";

const host = `${API_SERVER_HOST}/api/products`;

export const postAdd = async (product: FormData) => {
  const header = { headers: { "Content-Type": "multipart/form-data" } };

  // 경로 뒤 '/' 주의
  const res = await jwtAxios.post(`${host}/`, product, header);

  return res.data;
};

export const getList = async (
  pageParam: PageRequestParam,
): Promise<PageResponse<Product>> => {
  const { page, size } = pageParam;

  const res = await jwtAxios.get(`${host}/list`, {
    params: { page: page, size: size },
  });

  return res.data;
};

export const getOne = async (pno: number | string): Promise<Product> => {
  const res = await jwtAxios.get(`${host}/${pno}`);

  return res.data;
};

export const putOne = async (pno: number | string, product: FormData) => {
  const header = { headers: { "Content-Type": "multipart/form-data" } };

  const res = await jwtAxios.put(`${host}/${pno}`, product, header);

  return res.data;
};

export const deleteOne = async (pno: number | string) => {
  const res = await jwtAxios.delete(`${host}/${pno}`);

  return res.data;
};
