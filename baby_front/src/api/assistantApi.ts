import jwtAxios from "../util/jwtUtil";

export type AssistCategory = "SUBSIDY" | "CARE" | "VACCINATION";

export const ASSIST_CATEGORIES: AssistCategory[] = [
  "SUBSIDY",
  "CARE",
  "VACCINATION",
];

export type AssistStatus = "APPLY" | "DONE";

export interface ChildContext {
  babyMonths?: number;
  babyName?: string;
  gender?: string;
  regionSido?: string;
  regionSigungu?: string;
  householdSize?: number;
  incomeTags?: string[];
}

export interface AssistItem {
  id: string;
  category: AssistCategory;
  title: string;
  summary: string;
  source?: string;
  link?: string;
  status?: AssistStatus;
}

export interface AssistRecommendRequest {
  query?: string;
  categories?: AssistCategory[];
  child: ChildContext;
}

export interface AssistRecommendResponse {
  answer: string;
  items: AssistItem[];
  updatedAt?: string;
}

export interface AssistRegion {
  regionSido: string;
  regionSigungu: string;
  babyMonths?: number | null;
}

const prefix = "http://localhost:8080/api/assistant";

export const assistantApi = {
  recommend: async (
    payload: AssistRecommendRequest,
  ): Promise<AssistRecommendResponse> => {
    const res = await jwtAxios.post(`${prefix}/recommend`, payload);
    return res.data;
  },

  snapshot: async (): Promise<AssistRecommendResponse> => {
    const res = await jwtAxios.get(`${prefix}/snapshot`);
    return res.data;
  },

  getRegion: async (): Promise<AssistRegion> => {
    const res = await jwtAxios.get(`${prefix}/region`);
    return res.data;
  },

  saveRegion: async (payload: AssistRegion): Promise<void> => {
    await jwtAxios.put(`${prefix}/region`, payload);
  },

  refresh: async (): Promise<AssistRecommendResponse> => {
    const res = await jwtAxios.post(`${prefix}/refresh`);
    return res.data;
  },

  ask: async (
    payload: AssistRecommendRequest,
  ): Promise<AssistRecommendResponse> => {
    const res = await jwtAxios.post(`${prefix}/ask`, payload);
    return res.data;
  },
};
