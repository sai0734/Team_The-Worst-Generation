import jwtAxios from "../util/jwtUtil";

const API_SERVER_HOST = "http://localhost:8080";
const prefix = `${API_SERVER_HOST}/api/homecam`;

export interface SafeZoneRatioDTO {
  xRatio: number;
  yRatio: number;
  wRatio: number;
  hRatio: number;
}

export interface HomeCamAnalyzeResult {
  // 기준(baseline) 이미지가 아직 없으면 false - similarity/outOfZone은 무시할 것
  ready: boolean;
  similarity: number | null;
  outOfZone: boolean;
}

// 저장된 안전영역이 없으면 백엔드가 null 돌려줌
export const getSafeZone = async (): Promise<SafeZoneRatioDTO | null> => {
  const res = await jwtAxios.get(`${prefix}/safe-zone/`);
  return res.data;
};

// 있으면 덮어쓰고 없으면 새로 생성 (계정당 항상 1개 유지)
// baselineImageBase64를 같이 보내면 백엔드가 그 프레임으로 AI 서버에 기준 임베딩을 새로 만들어 저장함
export const saveSafeZone = async (
  zone: SafeZoneRatioDTO,
  baselineImageBase64?: string,
): Promise<void> => {
  await jwtAxios.put(`${prefix}/safe-zone/`, { ...zone, baselineImageBase64 });
};

// 안전영역으로 크롭된 현재 프레임을 보내서 기준 임베딩과 비교한 결과를 받아옴
// (실제 이미지 처리는 파이썬 AI서버에서 하고, 이 백엔드가 결과를 검증해서 내려줌)
export const analyzeFrame = async (
  imageBase64: string,
): Promise<HomeCamAnalyzeResult> => {
  const res = await jwtAxios.post(`${prefix}/analyze`, { imageBase64 });
  return res.data;
};
