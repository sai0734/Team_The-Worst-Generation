import jwtAxios from "../util/jwtUtil";

const API_SERVER_HOST = "http://localhost:8080";
const prefix = `${API_SERVER_HOST}/api/homecam/safe-zone`;

export interface SafeZoneRatioDTO {
  xRatio: number;
  yRatio: number;
  wRatio: number;
  hRatio: number;
}

// 저장된 안전영역이 없으면 백엔드가 null 돌려줌
export const getSafeZone = async (): Promise<SafeZoneRatioDTO | null> => {
  const res = await jwtAxios.get(`${prefix}/`);
  return res.data;
};

// 있으면 덮어쓰고 없으면 새로 생성 (계정당 항상 1개 유지)
export const saveSafeZone = async (zone: SafeZoneRatioDTO): Promise<void> => {
  await jwtAxios.put(`${prefix}/`, zone);
};
