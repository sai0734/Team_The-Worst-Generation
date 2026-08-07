import jwtAxios from "../util/jwtUtil";
import type { PageRequestParam, PageResponse } from "../types/page";

const API_SERVER_HOST = "http://localhost:8080";
const prefix = `${API_SERVER_HOST}/api/babysitter/profiles`;
const locationPrefix = `${API_SERVER_HOST}/api/babysitter/location`;
const pickPrefix = `${API_SERVER_HOST}/api/babysitter/picks`;

export type BabysitterGrade = "NEW" | "POPULAR" | "VETERAN" | "TOP";

export const GRADE_LABELS: Record<BabysitterGrade, string> = {
  NEW: "NEW",
  POPULAR: "인기",
  VETERAN: "베테랑",
  TOP: "TOP",
};

export type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
export type TimeSlot = "MORNING" | "AFTERNOON" | "EVENING";

export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  MON: "월",
  TUE: "화",
  WED: "수",
  THU: "목",
  FRI: "금",
  SAT: "토",
  SUN: "일",
};

export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  MORNING: "오전",
  AFTERNOON: "오후",
  EVENING: "저녁",
};

export interface BabysitterAvailability {
  dayOfWeek: DayOfWeek;
  timeSlot: TimeSlot;
}

export interface BabysitterProfile {
  email: string;
  name: string;
  careerYears: number;
  region: string | null;
  availableTime: string | null;
  hourlyRate: number | null;
  intro: string | null;
  status: "ACTIVE" | "INACTIVE";
  availability: BabysitterAvailability[];
  pickCount: number;
  grade: BabysitterGrade;
  regTime: string;
  modTime: string;
}

export interface BabysitterProfileInput {
  name: string;
  careerYears: number;
  region?: string;
  availableTime?: string;
  hourlyRate?: number;
  intro?: string;
  availability: BabysitterAvailability[];
}

export interface BabysitterSearchParam extends PageRequestParam {
  region?: string;
  keyword?: string;
  minCareerYears?: number;
  dayOfWeek?: DayOfWeek;
  timeSlot?: TimeSlot;
}

export const getMine = async (): Promise<BabysitterProfile> => {
  const res = await jwtAxios.get(`${prefix}/me`);

  return res.data;
};

export const getOne = async (email: string): Promise<BabysitterProfile> => {
  const res = await jwtAxios.get(`${prefix}/${email}`);

  return res.data;
};

export const save = async (
  profile: BabysitterProfileInput,
): Promise<{ RESULT: string }> => {
  const res = await jwtAxios.put(`${prefix}/`, profile);

  return res.data;
};

export const remove = async (): Promise<{ RESULT: string }> => {
  const res = await jwtAxios.delete(`${prefix}/`);

  return res.data;
};

export const getList = async (
  searchParam: BabysitterSearchParam,
): Promise<PageResponse<BabysitterProfile>> => {
  const res = await jwtAxios.get(`${prefix}/list`, { params: searchParam });

  return res.data;
};

export const getMyLocation = async (): Promise<string> => {
  const res = await jwtAxios.get(`${locationPrefix}/`);

  return res.data.region ?? "";
};

export const saveMyLocation = async (
  region: string,
): Promise<{ RESULT: string }> => {
  const res = await jwtAxios.put(`${locationPrefix}/`, { region });

  return res.data;
};

export const togglePick = async (email: string): Promise<{ picked: boolean }> => {
  const res = await jwtAxios.post(`${pickPrefix}/${email}`);

  return res.data;
};

export const isPicked = async (email: string): Promise<boolean> => {
  const res = await jwtAxios.get(`${pickPrefix}/${email}/mine`);

  return res.data.picked;
};
