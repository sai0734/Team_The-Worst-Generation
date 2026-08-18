import jwtAxios from "../util/jwtUtil";
import type { PageRequestParam, PageResponse } from "../types/page";

const API_SERVER_HOST = "http://localhost:8080";
const prefix = `${API_SERVER_HOST}/api/print-order`;

export interface PrintOrderItem {
  itemNo: number;
  albumNo: number;
  quantity: number;
  unitPrice: number;
  photoFileName: string;
}

export interface PrintOrder {
  orderNo: number;
  babyNo: number;
  orderId: string;
  status: string;
  totalAmount: number;
  receiverName: string;
  receiverPhone: string;
  zipcode: string;
  address: string;
  addressDetail: string;
  regTime: string;
  modTime: string;
  items: PrintOrderItem[];
}

export interface PrintOrderItemRequest {
  albumNo: number;
  quantity: number;
}

export interface PrintOrderCreateRequest {
  babyNo: number;
  receiverName: string;
  receiverPhone: string;
  zipcode: string;
  address: string;
  addressDetail: string;
  items: PrintOrderItemRequest[];
}

export const register = async (
  request: PrintOrderCreateRequest,
): Promise<PrintOrder> => {
  const res = await jwtAxios.post(`${prefix}/`, request);
  return res.data;
};

export const confirm = async (
  orderId: string,
  paymentKey: string,
  amount: number,
): Promise<PrintOrder> => {
  const res = await jwtAxios.post(`${prefix}/confirm`, {
    orderId,
    paymentKey,
    amount,
  });
  return res.data;
};

export const getList = async (
  param: PageRequestParam,
): Promise<PageResponse<PrintOrder>> => {
  const res = await jwtAxios.get(`${prefix}/list`, { params: param });
  return res.data;
};

export const getDetail = async (orderId: string): Promise<PrintOrder> => {
  const res = await jwtAxios.get(`${prefix}/${orderId}`);
  return res.data;
};
