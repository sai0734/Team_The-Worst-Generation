import jwtAxios from "../util/jwtUtil";

const API_SERVER_HOST = "http://localhost:8080";
const prefix = `${API_SERVER_HOST}/api/ledger`;

export type LedgerType = "INCOME" | "EXPENSE";

export type LedgerCategory =
  | "FOOD"
  | "BABY_GOODS"
  | "MEDICAL"
  | "EDUCATION"
  | "HOUSING"
  | "TRANSPORT"
  | "LEISURE"
  | "SALARY"
  | "SUBSIDY"
  | "ALLOWANCE"
  | "ETC";

export const CATEGORY_LABELS: Record<LedgerCategory, string> = {
  FOOD: "식비",
  BABY_GOODS: "육아용품",
  MEDICAL: "병원비",
  EDUCATION: "교육비",
  HOUSING: "주거비",
  TRANSPORT: "교통비",
  LEISURE: "문화/여가",
  SALARY: "급여",
  SUBSIDY: "지원금",
  ALLOWANCE: "용돈",
  ETC: "기타",
};

export const CATEGORY_ORDER: LedgerCategory[] = [
  "FOOD",
  "BABY_GOODS",
  "MEDICAL",
  "EDUCATION",
  "HOUSING",
  "TRANSPORT",
  "LEISURE",
  "SALARY",
  "SUBSIDY",
  "ALLOWANCE",
  "ETC",
];

// LedgerDTO
export interface Ledger {
  lno?: number;
  email?: string;
  type: LedgerType;
  category: LedgerCategory;
  amount: number;
  memo?: string;
  txDate?: string; // yyyy-MM-dd
  regTime?: string;
}

// LedgerSummaryDTO
export interface LedgerSummary {
  cycleStart: string;
  cycleEnd: string;
  totalIncome: number;
  totalExpense: number;
  categoryBreakdown: Partial<Record<LedgerCategory, number>>;
  prevCycleStart: string;
  prevCycleEnd: string;
  prevTotalIncome: number;
  prevTotalExpense: number;
  prevCategoryBreakdown: Partial<Record<LedgerCategory, number>>;
}

// LedgerSettingDTO
export interface LedgerSetting {
  email: string;
  briefingDay: number | null;
  lastBriefingCycleStart: string | null;
  briefingAvailable: boolean;
}

// LedgerBriefingDTO
export interface LedgerBriefing {
  summary: string;
  stats: LedgerSummary;
  generatedAt: string;
}

// LedgerClassifyResponseDTO
export interface LedgerClassifyResult {
  type: LedgerType;
  category: LedgerCategory;
  amount: number | null;
  description: string | null;
}

export const registerLedger = async (ledger: Ledger): Promise<number> => {
  const res = await jwtAxios.post(`${prefix}/`, ledger);
  return res.data.LNO;
};

export const getLedgerList = async (
  start: string,
  end: string,
): Promise<Ledger[]> => {
  const res = await jwtAxios.get(`${prefix}/`, { params: { start, end } });
  return res.data;
};

export const modifyLedger = async (lno: number, ledger: Ledger): Promise<void> => {
  await jwtAxios.put(`${prefix}/${lno}`, ledger);
};

export const removeLedger = async (lno: number): Promise<void> => {
  await jwtAxios.delete(`${prefix}/${lno}`);
};

export const getSummary = async (): Promise<LedgerSummary> => {
  const res = await jwtAxios.get(`${prefix}/summary`);
  return res.data;
};

export const getSetting = async (): Promise<LedgerSetting> => {
  const res = await jwtAxios.get(`${prefix}/setting`);
  return res.data;
};

export const classifyMemo = async (
  memo: string,
): Promise<LedgerClassifyResult> => {
  const res = await jwtAxios.post(`${prefix}/classify`, { memo });
  return res.data;
};

export const classifyMemoBulk = async (
  memos: string[],
): Promise<LedgerClassifyResult[]> => {
  const res = await jwtAxios.post(`${prefix}/classify-bulk`, { memos });
  return res.data;
};

export const classifyReceiptImage = async (
  image: File,
): Promise<LedgerClassifyResult[]> => {
  const formData = new FormData();
  formData.append("image", image);

  const res = await jwtAxios.post(`${prefix}/classify-receipt`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const getBriefing = async (): Promise<LedgerBriefing> => {
  const res = await jwtAxios.post(`${prefix}/briefing`);
  return res.data;
};
