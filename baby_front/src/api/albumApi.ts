import jwtAxios from "../util/jwtUtil";
import type { PageRequestParam, PageResponse } from "../types/page";

const API_SERVER_HOST = "http://localhost:8080";
const prefix = `${API_SERVER_HOST}/api/baby-album`;

export interface BabyAlbum {
  albumNo: number;
  babyNo: number;
  photoFileName: string;
  takenDate: string;
  latitude: number | null;
  longitude: number | null;
  regTime: string;
}

export interface AlbumListParam extends PageRequestParam {
  babyNo: number;
  sort?: "latest" | "lodest";
}

export const getViewUrl = (fileName: string): string =>
  `${prefix}/view/${fileName}`;

export const getThumbnailUrl = (fileName: string): string =>
  `${prefix}/view/s_${fileName}`;

export const getList = async (
  param: AlbumListParam,
): Promise<PageResponse<BabyAlbum>> => {
  const res = await jwtAxios.get(`${prefix}/list`, { params: param });

  return res.data;
};

export const register = async (
  formData: FormData,
): Promise<{ albumNo: number }> => {
  const res = await jwtAxios.post(`${prefix}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
};

export const remove = async (albumNo: number): Promise<{ albumNo: number }> => {
  const res = await jwtAxios.delete(`${prefix}/${albumNo}`);

  return res.data;
};
