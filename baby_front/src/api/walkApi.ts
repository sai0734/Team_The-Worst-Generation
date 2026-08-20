import axios from "axios";
import type { WalkAiRecommendation } from "../types/walk";

const API_SERVER_HOST = "http://localhost:8080";
const prefix = `${API_SERVER_HOST}/api/walk/trail`;

// 카카오 로컬 API 실시간 후보 + 날씨 + 올라마 코멘트 기반 추천
export const getAiRecommendation = async (
  lat: number,
  lng: number,
): Promise<WalkAiRecommendation> => {
  const res = await axios.get(`${prefix}/ai-recommend`, {
    params: { lat, lng },
  });
  return res.data;
};
