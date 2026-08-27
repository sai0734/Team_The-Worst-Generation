import jwtAxios from "../util/jwtUtil";

export type AssistCategory = "SUBSIDY" | "CARE" | "VACCINATION";
export type AssistStatus = "APPLY" | "DONE";
export type MedianIncomeBand =
  | "UNDER_50"
  | "50_TO_75"
  | "75_TO_100"
  | "100_TO_120"
  | "120_TO_150"
  | "150_TO_180"
  | "180_TO_200"
  | "200_TO_250"
  | "OVER_250"
  | "UNKNOWN";

export interface ChildContext {
  babyMonths?: number;
  babyName?: string;
  gender?: string;
  regionSido?: string;
  regionSigungu?: string;
  householdSize?: number;
  medianIncomeBand?: MedianIncomeBand;
  householdTypes?: string[];
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
  child: ChildContext;
}

export interface AssistRecommendResponse {
  answer: string;
  items: AssistItem[];
}

export interface AssistRegion {
  regionSido: string;
  regionSigungu: string;
  babyMonths?: number | null;
}

const prefix = "http://localhost:8080/api/assistant";
const ASK_TIMEOUT_MS = 90_000;

export const assistantApi = {
  getRegion: async (): Promise<AssistRegion> => {
    const res = await jwtAxios.get(`${prefix}/region`);
    return res.data;
  },

  saveRegion: async (payload: AssistRegion): Promise<void> => {
    await jwtAxios.put(`${prefix}/region`, payload);
  },

  ask: async (
    payload: AssistRecommendRequest,
  ): Promise<AssistRecommendResponse> => {
    const res = await jwtAxios.post(`${prefix}/ask`, payload, {
      timeout: ASK_TIMEOUT_MS,
    });
    return res.data;
  },
};
