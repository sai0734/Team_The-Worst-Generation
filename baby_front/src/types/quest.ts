export type QuestType = "DAILY" | "URGENT";
export type QuestStatus = "TODO" | "DONE";



export interface MemberQuest {
    id: number;
    questId: number;
    title: string;
    type: QuestType;
    description?: string;
    reward?: number;
    status: QuestStatus;
    assignedDate: string; //yyyy-MM-dd
    completeAt: string | null;
}