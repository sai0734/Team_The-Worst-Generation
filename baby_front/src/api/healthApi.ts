import jwtAxios from "../util/jwtUtil";
import type { BabySkinCheck, BabyStoolCheck } from "../types/health";

const API_SERVER_HOST = "http://localhost:8080";
const host = `${API_SERVER_HOST}/api/health`;

export const checkSkin = async (
  babyNo: number,
  image: File,
): Promise<BabySkinCheck> => {
  const formData = new FormData();
  formData.append("babyNo", String(babyNo));
  formData.append("image", image);

  const header = { headers: { "Content-Type": "multipart/form-data" } };

  const res = await jwtAxios.post(`${host}/skin`, formData, header);

  return res.data;
};

export const getSkinHistory = async (
  babyNo: number,
): Promise<BabySkinCheck[]> => {
  const res = await jwtAxios.get(`${host}/skin`, { params: { babyNo } });

  return res.data;
};

export const checkStool = async (
  babyNo: number,
  image: File,
): Promise<BabyStoolCheck> => {
  const formData = new FormData();
  formData.append("babyNo", String(babyNo));
  formData.append("image", image);

  const header = { headers: { "Content-Type": "multipart/form-data" } };

  const res = await jwtAxios.post(`${host}/stool`, formData, header);

  return res.data;
};

export const getStoolHistory = async (
  babyNo: number,
): Promise<BabyStoolCheck[]> => {
  const res = await jwtAxios.get(`${host}/stool`, { params: { babyNo } });

  return res.data;
};
