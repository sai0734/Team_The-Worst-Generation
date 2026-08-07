import jwtAxios from "../util/jwtUtil";
import type { PageRequestParam, PageResponse } from "../types/page";

export interface BabysitterProfile {
  email: string;
  name: string;
  careerYears: number;
  region: string | null;
  availableTime: string | null;
  hourlyRate: number | null;
  intro: string | null;
  status: "ACTIVE" | "INACTIVE";
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
}

export interface BabysitterSearchParam extends PageRequestParam {
  region?: string;
  keyword?: string;
  minCareerYears?: number;
}

const API_SERVER_HOST = "http://localhost:8080";
const prefix = `${API_SERVER_HOST}/api/babysitter/profiles`;

export const babysitterApi = {
  getMine: async (): Promise<BabysitterProfile> => {
    const res = await jwtAxios.get(`${prefix}/me`);
    return res.data;
  },

  getOne: async (email: string): Promise<BabysitterProfile> => {
    const res = await jwtAxios.get(`${prefix}/${email}`);
    return res.data;
  },

  save: async (profile: BabysitterProfileInput): Promise<{ RESULT: string }> => {
    const res = await jwtAxios.put(`${prefix}/`, profile);
    return res.data;
  },

  remove: async (): Promise<{ RESULT: string }> => {
    const res = await jwtAxios.delete(`${prefix}/`);
    return res.data;
  },

  getList: async (
    searchParam: BabysitterSearchParam,
  ): Promise<PageResponse<BabysitterProfile>> => {
    const res = await jwtAxios.get(`${prefix}/list`, { params: searchParam });
    return res.data;
  },
};
