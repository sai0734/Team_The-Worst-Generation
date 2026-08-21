import jwtAxios from "../util/jwtUtil";
import type { PageRequestParam, PageResponse } from "../types/page";

const API_SERVER_HOST = "http://localhost:8080";
const prefix = `${API_SERVER_HOST}/api/baby-behavior`;

export interface BehaviorStep {
  stepOrder: number;
  title: string;
  description: string;
}

export interface BehaviorSource {
  title: string;
  link: string;
  press: string | null;
  pubDate: string;
}

export interface BehaviorMessage {
  role: string;
  content: string;
}

export interface BehaviorConsult {
  consultNo: number;
  category: string;
  situation: string;
  aiSummary: string;
  steps: BehaviorStep[];
  sources: BehaviorSource[];
  videoId: string | null;
  videoTitle: string | null;
  messages: BehaviorMessage[];
  regTime: string;
}

export interface ConsultListParam extends PageRequestParam {
  babyNo: number;
}

export const createConsult = async (
  babyNo: number,
  category: string,
  situation: string,
): Promise<BehaviorConsult> => {
  const res = await jwtAxios.post(`${prefix}/`, {
    babyNo,
    category,
    situation,
  });

  return res.data;
};

export const addMessage = async (
  consultNo: number,
  content: string,
): Promise<BehaviorConsult> => {
  const res = await jwtAxios.post(`${prefix}/message`, { consultNo, content });

  return res.data;
};

export const getList = async (
  param: ConsultListParam,
): Promise<PageResponse<BehaviorConsult>> => {
  const res = await jwtAxios.get(`${prefix}/list`, { params: param });

  return res.data;
};

export const getDetail = async (
  consultNo: number,
): Promise<BehaviorConsult> => {
  const res = await jwtAxios.get(`${prefix}/${consultNo}`);

  return res.data;
};

export const remove = async (consultNo: number): Promise<void> => {
  await jwtAxios.delete(`${prefix}/${consultNo}`);
};
