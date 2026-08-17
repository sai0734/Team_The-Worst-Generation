import jwtAxios from "../util/jwtUtil";
import type { PageRequestParam, PageResponse } from "../types/page";

const API_SERVER_HOST = "http://localhost:8080";
const prefix = `${API_SERVER_HOST}/api/diary`;

export interface BabyDiary {
  diaryNo: number;
  babyNo: number;
  diaryDate: string;
  photoFileName: string | null;
  content: string;
  regTime: string;
  modTime: string;
}

export interface DiaryListParam extends PageRequestParam {
  babyNo: number;
  keyword?: string;
}

export const getViewUrl = (fileName: string): string =>
  `${prefix}/view/${fileName}`;

export const getThumbnailUrl = (fileName: string): string =>
  `${prefix}/view/s_${fileName}`;

export const getList = async (
  param: DiaryListParam,
): Promise<PageResponse<BabyDiary>> => {
  const res = await jwtAxios.get(`${prefix}/list`, { params: param });

  return res.data;
};

export const register = async (
  formData: FormData,
): Promise<{ diaryNo: number }> => {
  const res = await jwtAxios.post(`${prefix}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
};

export const modify = async (
  diaryNo: number,
  formData: FormData,
): Promise<{ diaryNo: number }> => {
  const res = await jwtAxios.put(`${prefix}/${diaryNo}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
};

export const remove = async (diaryNo: number): Promise<{ diaryNo: number }> => {
  const res = await jwtAxios.delete(`${prefix}/${diaryNo}`);

  return res.data;
};
