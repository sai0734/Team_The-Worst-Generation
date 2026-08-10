import jwtAxios from "../util/jwtUtil";
const API_SERVER_HOST = "http://localhost:8080";

const host = `${API_SERVER_HOST}/api/growth-percentile`;

export interface GrowthPercentile {
  percentileNo?: number;
  ageMonth: number;
  gender: string;
  avgWeightKg: number;
  avgHeightCm: number;
}

export const getOne = async (babyNo: number | string) => {
  const res = await jwtAxios.get(`${host}/${babyNo}`);

  return res.data;
};
