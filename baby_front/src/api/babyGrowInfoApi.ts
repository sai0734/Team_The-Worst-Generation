import jwtAxios from "../util/jwtUtil";
import { API_SERVER_HOST } from "./todoApi";

const host = `${API_SERVER_HOST}/api/baby-grow-info`;

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
