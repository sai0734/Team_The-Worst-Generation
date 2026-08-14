import jwtAxios from "../util/jwtUtil";

export type AssistCategory =
  | "CHILDCARE"
  | "SUBSIDY"
  | "WELFARE"
  | "CARE"
  | "VACCINATION"
  | "FACILITY";

export type AssistStatus = "APPLY" | "DONE";

export interface ChildContext {
  babyMonths?: number;
  regionSido?: string;
  regionSigungu?: string;
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
}

const prefix = "http://localhost:8080/api/assistant";

export const assistantApi = {
  recommend: async (
    payload: AssistRecommendRequest,
  ): Promise<AssistRecommendResponse> => {
    const res = await jwtAxios.post(`${prefix}/recommend`, payload);
    return res.data;
  },
};
