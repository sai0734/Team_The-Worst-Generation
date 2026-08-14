import jwtAxios from "../util/jwtUtil";
import axios from "axios";
import type { PageRequestParam, PageResponse } from "../types/page";

const API_SERVER_HOST = "http://localhost:8080";
const prefix = `${API_SERVER_HOST}/api/market/items`;

export const MARKET_CATEGORIES = [
  "유모차",
  "카시트",
  "아기띠",
  "장난감",
  "수유용품",
];

// MarketItemDTO
export interface MarketItem {
  itemNo?: number;
  sellerEmail?: string;
  title: string;
  price: number;
  description: string;
  tradeType: "SALE" | "RENTAL";
  category: string;
  ageRange?: string;
  condition?: string;
  allowOffer: boolean;
  status?: string; // 거래가능 | 거래완료
  locationName?: string;
  latitude?: number;
  longitude?: number;
  // /nearby 조회 시에만 채워짐 - 기준 좌표로부터의 거리 (km)
  distanceKm?: number;
  viewCount?: number;
  recallChecked?: boolean;
  recallFlag?: boolean;
  bumpAt?: string;
  regTime?: string;
  modTime?: string;
  // tradeType이 RENTAL 일 때만 사용
  deposit?: number;
  minDays?: number;
  maxDays?: number;
  uploadFileNames?: string[];
}

export type MarketItemListParam = PageRequestParam;

// 등록 / 수정은 파일 업로드가 섞여 있어서 백엔드가 @RequestBody 대신 form-data 바인딩을 씀
const toFormData = (item: MarketItem, files: File[]) => {
  const formData = new FormData();

  formData.append("title", item.title);
  formData.append("price", String(item.price));
  formData.append("description", item.description);
  formData.append("tradeType", item.tradeType);
  formData.append("category", item.category);
  if (item.ageRange) formData.append("ageRange", item.ageRange);
  if (item.condition) formData.append("condition", item.condition);
  formData.append("allowOffer", String(item.allowOffer));
  if (item.locationName) formData.append("locationName", item.locationName);
  if (item.latitude !== undefined)
    formData.append("latitude", String(item.latitude));
  if (item.longitude !== undefined)
    formData.append("longitude", String(item.longitude));

  if (item.tradeType === "RENTAL") {
    if (item.deposit !== undefined)
      formData.append("deposit", String(item.deposit));
    if (item.minDays !== undefined)
      formData.append("minDays", String(item.minDays));
    if (item.maxDays !== undefined)
      formData.append("maxDays", String(item.maxDays));
  }

  files.forEach((file) => formData.append("files", file));

  return formData;
};

export const registerItem = async (
  item: MarketItem,
  files: File[],
): Promise<number> => {
  const formData = toFormData(item, files);

  const res = await jwtAxios.post(`${prefix}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.result;
};

export const getItem = async (itemNo: number): Promise<MarketItem> => {
  const res = await jwtAxios.get(`${prefix}/${itemNo}`);
  return res.data;
};

export const getItemList = async (
  param: MarketItemListParam,
): Promise<PageResponse<MarketItem>> => {
  const res = await axios.get(`${prefix}/list`, { params: param });
  return res.data;
};

// 내 위치(lat, lng) 기준 반경 radiusKm(기본 5km) 안의 거래가능 매물, 가까운 순
export const getNearbyItems = async (
  lat: number,
  lng: number,
  radiusKm = 5,
): Promise<MarketItem[]> => {
  const res = await axios.get(`${prefix}/nearby`, {
    params: { lat, lng, radiusKm },
  });
  return res.data;
};

// keepFileNames: 기존 파일 중 계속 유지할 파일명, newFiles: 새로 추가하는 파일
export const modifyItem = async (
  itemNo: number,
  item: MarketItem,
  newFiles: File[],
  keepFileNames: string[],
): Promise<void> => {
  const formData = toFormData(item, newFiles);
  keepFileNames.forEach((name) => formData.append("uploadFileNames", name));

  await jwtAxios.put(`${prefix}/${itemNo}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const removeItem = async (itemNo: number): Promise<void> => {
  await jwtAxios.delete(`${prefix}/${itemNo}`);
};

export const bumpItem = async (itemNo: number): Promise<void> => {
  await jwtAxios.put(`${prefix}/${itemNo}/bump`);
};

export const getMyItems = async (): Promise<MarketItem[]> => {
  const res = await jwtAxios.get(`${prefix}/mine`);
  return res.data;
};

export const completeItem = async (itemNo: number): Promise<void> => {
  await jwtAxios.put(`${prefix}/${itemNo}/complete`);
};

export const getFileUrl = (fileName: string): string =>
  `${prefix}/files/${fileName}`;
