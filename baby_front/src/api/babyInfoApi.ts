import jwtAxios from "../util/jwtUtil";
const API_SERVER_HOST = "http://localhost:8080";

const host = `${API_SERVER_HOST}/api/baby-info`;

export interface BabyInfo {
  babyNo?: number;
  email?: string;
  babyName: string;
  birthDate: string;
  gender: string;
  profileImageFileName?: string;
  bloodType?: string;
  birthWeekCount?: number;
  birthWeight?: number;
  birthHeight?: number;
  headCircumference?: number;
  regTime?: string;
  modTime?: string;
}

export const getList = async (): Promise<BabyInfo[]> => {
  const res = await jwtAxios.get(`${host}/list`);

  return res.data;
};

export const getOne = async (babyNo: number | string) => {
  const res = await jwtAxios.get(`${host}/${babyNo}`);

  return res.data;
};

export const register = async (babyInfo: FormData) => {
  const header = { headers: { "Content-Type": "multipart/form-data" } };

  const res = await jwtAxios.post(`${host}/`, babyInfo, header);

  return res.data;
};

export const modify = async (babyInfo: FormData, babyNo: number | string) => {
  const header = { headers: { "Content-Type": "multipart/form-data" } };

  const res = await jwtAxios.put(`${host}/${babyNo}`, babyInfo, header);

  return res.data;
};

export const remove = async (babyNo: number | string) => {
  const res = await jwtAxios.delete(`${host}/${babyNo}`);

  return res.data;
};

export const getViewUrl = (fileName: string) => `${host}/view/${fileName}`;
