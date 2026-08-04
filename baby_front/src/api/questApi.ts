import { MemberQuest } from "../types/quest";
import jwtAxios from "../util/jwtUtil";

export const API_SERVER_HOST = "http://localhost:8080";
const prefix = `${API_SERVER_HOST}/api/quest`;

//오늘 배정된 일일, 긴급퀘스트 목록
//서버통신(오늘 배정된 퀘스트 배열을 받음)
export const getTodayQuests = async (): Promise<MemberQuest[]> => {
  const res = await jwtAxios.get(`${prefix}/today`);
  return res.data;
};

//완료처리
export const completeQuest = async (id: number): Promise<MemberQuest> => {
  const res = await jwtAxios.put(`${prefix}/${id}/complete`);
  return res.data;
};
