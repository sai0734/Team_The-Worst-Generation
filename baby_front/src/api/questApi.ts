import type { MemberQuest, QuestHome } from "../types/quest";
import jwtAxios from "../util/jwtUtil";

export const API_SERVER_HOST = "http://localhost:8080";
const prefix = `${API_SERVER_HOST}/api/quest`;

// YSJ - 홈 퀘스트(일일/주간/이벤트/긴급)
export const getQuestHome = async (): Promise<QuestHome> => {
  const res = await jwtAxios.get(`${prefix}/home`);
  return res.data;
};

export const completeQuest = async (id: number): Promise<MemberQuest> => {
  const res = await jwtAxios.put(`${prefix}/${id}/complete`);
  return res.data;
};

export const createUrgentQuest = async (payload: {
  title: string;
  description?: string;
  reward: number;
  urgency: number;
}) => {
  const res = await jwtAxios.post(`${prefix}/urgent`, payload);
  return res.data;
};
