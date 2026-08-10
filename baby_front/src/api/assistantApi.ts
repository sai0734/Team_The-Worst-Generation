import jwtAxios from "../util/jwtUtil";

//서버호출

export type AssistCategory =
  | "CHILDCARE"
  | "SUBSIDY"
  | "WELFARE"
  | "CARE"
  | "VACCINATION"
  | "FACILITY";

export interface ChildContext {
  babyMonths?: number;
  regionSido?: string; //ex) 서울
  regionSigungu?: string; //ex) 강남구
}

export interface AssistItem {
  id: string;
  category: AssistCategory;
  title: string;
  summary: string;
  source?: string;
  link?: string;
}

export interface AssistRecommendRequest {
  query: string;
  categories: AssistCategory[];
  child: ChildContext;
}

export interface AssistRecommendResponse {
  answer: string;
  items: AssistItem[];
}

const prefix = "http://localhost:8080/api/assistant";

export const assistantApi = {
  //실제 API/오픈클로 교체
  recommend: async (
    payload: AssistRecommendRequest,
  ): Promise<AssistRecommendResponse> => {
    const res = await jwtAxios.post(`${prefix}/recommend`, payload);    //서버URL로 보냄, 로그인 필수
    return res.data;
  },
};
