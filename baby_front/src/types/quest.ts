export type QuestType = "DAILY" | "WEEKLY" | "EVENT" | "URGENT";
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
  weeklyQuests: MemberQuest[];
  eventQuests: MemberQuest[];
  urgentQuests: MemberQuest[];
  point: number;
}
