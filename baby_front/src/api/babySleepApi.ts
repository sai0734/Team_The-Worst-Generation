import jwtAxios from "../util/jwtUtil";
const API_SERVER_HOST = "http://localhost:8080";

const host = `${API_SERVER_HOST}/api/baby-sleep`;

export interface BabySleep {
  sleepNo?: number;
  babyNo: number;
  sleepType: string;
  startTime: string;
  endTime?: string;
  regTime?: string;
}

export const getList = async (babyNo: number | string) => {
  const res = await jwtAxios.get(`${host}/${babyNo}`);

  return res.data;
};

export const register = async (babySleep: Partial<BabySleep>) => {
  const res = await jwtAxios.post(`${host}/`, babySleep);

  return res.data;
};

export const modify = async (
  sleepNo: number | string,
  babySleep: Partial<BabySleep>,
) => {
  const res = await jwtAxios.put(`${host}/${sleepNo}`, babySleep);

  return res.data;
};

export const remove = async (sleepNo: number | string) => {
  const res = await jwtAxios.delete(`${host}/${sleepNo}`);

  return res.data;
};
