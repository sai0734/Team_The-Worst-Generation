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
  // 안전영역 자체가 아직 저장된 적 없으면 false - outOfZone은 무시할 것
  ready: boolean;
  outOfZone: boolean;
}

// 저장된 안전영역이 없으면 백엔드가 null 돌려줌
export const getSafeZone = async (): Promise<SafeZoneRatioDTO | null> => {
  const res = await jwtAxios.get(`${prefix}/safe-zone/`);
  return res.data;
};

// 있으면 덮어쓰고 없으면 새로 생성 (계정당 항상 1개 유지)
export const saveSafeZone = async (zone: SafeZoneRatioDTO): Promise<void> => {
  await jwtAxios.put(`${prefix}/safe-zone/`, zone);
};

// 카메라 전체 프레임을 보내서 안전영역 이탈 여부를 판정받아옴
// (사람 탐지는 파이썬 AI서버(YOLOv8 + OpenCV)에서 하고, 이 백엔드가 저장된 안전영역과
// 겹치는지 비교해서 결과를 내려줌)
export const analyzeFrame = async (
  imageBase64: string,
): Promise<HomeCamAnalyzeResult> => {
  const res = await jwtAxios.post(`${prefix}/analyze`, { imageBase64 });
  return res.data;
};
