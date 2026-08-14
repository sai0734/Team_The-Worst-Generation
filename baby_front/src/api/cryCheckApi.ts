import jwtAxios from "../util/jwtUtil";

const API_SERVER_HOST = "http://localhost:8080";
const prefix = `${API_SERVER_HOST}/api/cry-check`;

export interface CryCandidate {
  rank: number;
  cause: string;
  reason: string;
}

export interface CryResult {
  candidates: CryCandidate[];
  notice?: string;
}

export interface CryCheck {
  cryCheckNo: number;
  babyNo: number;
  avgPitch: number;
  avgVolume: number;
  durationSeconds: number;
  pattern: string;
  aiResultJson: string;
  regTime: string;
}

export interface CryCheckAnalyzeParam {
  babyNo: number;
  avgPitch: number;
  avgVolume: number;
  durationSeconds: number;
  pattern: string;
}

export const parseAiResult = (aiResultJson: string): CryResult => {
  try {
    const parsed = JSON.parse(aiResultJson);
    return {
      candidates: Array.isArray(parsed.candidates) ? parsed.candidates : [],
      notice: parsed.notice,
    };
  } catch {
    return { candidates: [], notice: aiResultJson };
  }
};

export const analyze = async (
  param: CryCheckAnalyzeParam,
): Promise<CryCheck> => {
  const res = await jwtAxios.post(`${prefix}/`, param);

  return res.data;
};

export const get = async (cryCheckNo: number): Promise<CryCheck> => {
  const res = await jwtAxios.get(`${prefix}/${cryCheckNo}`);

  return res.data;
};

export const getList = async (babyNo: number): Promise<CryCheck[]> => {
  const res = await jwtAxios.get(`${prefix}/list/${babyNo}`);

  return res.data;
};
