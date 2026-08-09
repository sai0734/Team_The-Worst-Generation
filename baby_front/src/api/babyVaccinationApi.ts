import jwtAxios from "../util/jwtUtil";
const API_SERVER_HOST = "http://localhost:8080";

const host = `${API_SERVER_HOST}/api/baby-vaccination`;

export interface BabyVaccination {
  vaccinationNo?: number;
  babyNo: number;
  scheduleNo?: number;
  vaccineName: string;
  doseLabel?: string;
  recommendedMonth?: number;
  completed: boolean;
  completedDate?: string;
  hospitalName?: string;
  isCustom: boolean;
  regTime?: string;
}

export interface VaccinationProgress {
  totalCount: number;
  completedCount: number;
  dDay: number | null;
  nextVaccineName: string | null;
}

export const getList = async (babyNo: number | string) => {
  const res = await jwtAxios.get(`${host}/${babyNo}`);

  return res.data;
};

export const init = async (babyNo: number | string) => {
  const res = await jwtAxios.post(`${host}/${babyNo}/init`);

  return res.data;
};

export const completeCheck = async (
  vaccinationNo: number | string,
  babyVaccination: Partial<BabyVaccination>,
) => {
  const res = await jwtAxios.put(`${host}/${vaccinationNo}`, babyVaccination);

  return res.data;
};

export const registerCustom = async (
  babyVaccination: Partial<BabyVaccination>,
) => {
  const res = await jwtAxios.post(`${host}/`, babyVaccination);

  return res.data;
};

export const remove = async (vaccinationNo: number | string) => {
  const res = await jwtAxios.delete(`${host}/${vaccinationNo}`);

  return res.data;
};

export const getProgress = async (babyNo: number | string) => {
  const res = await jwtAxios.get(`${host}/${babyNo}/progress`);

  return res.data;
};
