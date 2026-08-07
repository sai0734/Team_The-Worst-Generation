import jwtAxios from "../util/jwtUtil";
const API_SERVER_HOST = "http://localhost:8080";

const host = `${API_SERVER_HOST}/api/baby-grow-info`;

export interface BabyGrowInfo {
  babyGrowNo?: number;
  babyNo: number;
  measuredDate: string;
  weight?: number;
  height?: number;
  regTime?: string;
}

export const getList = async (babyNo: number | string) => {
  const res = await jwtAxios.get(`${host}/list/${babyNo}`);

  return res.data;
};

export const getOne = async (babyGrowNo: number | string) => {
  const res = await jwtAxios.get(`${host}/${babyGrowNo}`);

  return res.data;
};

export const register = async (babyGrowInfo: object) => {
  const res = await jwtAxios.post(`${host}/`, babyGrowInfo);

  return res.data;
};

export const remove = async (babyGrowNo: number | string) => {
  const res = await jwtAxios.delete(`${host}/${babyGrowNo}`);

  return res.data;
};
