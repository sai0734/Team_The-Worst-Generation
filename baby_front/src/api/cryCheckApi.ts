import jwtAxios from "../util/jwtUtil";

const API_SERVER_HOST = "http://localhost:8080";
const prefix = `${API_SERVER_HOST}/api/cry-check`;

export interface CryCandidate {
  rank: number;
  cause: string;
  confidence?: number;
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
  audioFileName?: string;
  userFeedback?: string;
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

// file: 녹음/업로드한 오디오(또는 영상, 프론트에서 그대로 올려도 서버가 다시듣기 땐 오디오만 재생됨)
// 다시듣기용으로 서버에 저장됨. fileName은 recorder blob처럼 자체 파일명이 없는 경우에만 필요.
export const analyze = async (
  param: CryCheckAnalyzeParam,
  file: Blob,
  fileName = "recording.webm",
): Promise<CryCheck> => {
  const formData = new FormData();
  formData.append("babyNo", String(param.babyNo));
  formData.append("avgPitch", String(param.avgPitch));
  formData.append("avgVolume", String(param.avgVolume));
  formData.append("durationSeconds", String(param.durationSeconds));
  formData.append("pattern", param.pattern);
  formData.append(
    "file",
    file,
    file instanceof File ? file.name : fileName,
  );

  const res = await jwtAxios.post(`${prefix}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

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

export const getFileUrl = (fileName: string): string =>
  `${prefix}/files/${fileName}`;

// 피드백 칩("배고픔 맞음" 등) 응답 저장
export const submitFeedback = async (
  cryCheckNo: number,
  feedback: string,
): Promise<void> => {
  await jwtAxios.put(`${prefix}/${cryCheckNo}/feedback`, null, {
    params: { feedback },
  });
};

export const remove = async (cryCheckNo: number): Promise<void> => {
  await jwtAxios.delete(`${prefix}/${cryCheckNo}`);
};
