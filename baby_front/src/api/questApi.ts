import jwtAxios from "../util/jwtUtil";

// YSJ - 퀘스트 타입
export type QuestType = "DAILY" | "URGENT";
export type QuestStatus = "TODO" | "DONE" | "FAILED" | "EXPIRED";

export interface Quest {
  questId: number;
  title: string;
  description?: string;
  type: QuestType;
  reward: number;
  urgency?: number;
  difficulty?: string;
  theme?: string;
  dueDays?: number;
}

export interface MemberQuest {
  id: number;
  memberEmail?: string;
  questId: number;
  status: QuestStatus;
  assignedDate: string;
  completedAt: string | null;
  dueDate?: string | null;
  quest: Quest;
}

export interface QuestHome {
  dailyQuests: MemberQuest[];
  urgentQuests: MemberQuest[];
  point: number;
}

export interface UrgentQuestCreate {
  title: string;
  description?: string;
  reward: number;
  urgency: number;
}

// YSJ - 백엔드 주소 연결
export const API_SERVER_HOST = "http://localhost:8080";
const prefix = `${API_SERVER_HOST}/api/quest`;

export const questApi = {
  getHome: async (): Promise<QuestHome> => {
    const res = await jwtAxios.get(`${prefix}/home`);
    return res.data;
  },

  complete: async (id: number): Promise<MemberQuest> => {
    const res = await jwtAxios.put(`${prefix}/${id}/complete`);
    return res.data;
  },

  uncomplete: async (id: number): Promise<MemberQuest> => {
    const res = await jwtAxios.put(`${prefix}/${id}/uncomplete`);
    return res.data;
  },

  createUrgent: async (payload: UrgentQuestCreate): Promise<MemberQuest> => {
    const res = await jwtAxios.post(`${prefix}/urgent`, payload);
    return res.data;
  },
};
