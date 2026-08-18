import jwtAxios from "../util/jwtUtil";
import axios from "axios";
import type { WalkTrail } from "../types/walk";

const API_SERVER_HOST = "http://localhost:8080";
const prefix = `${API_SERVER_HOST}/api/walk/trail`;

// 내 위치(lat, lng) 기준 반경 radiusKm(기본 5km) 안에서 가까운 순으로 limit(기본 5)개 추천
export const getNearbyTrails = async (
  lat: number,
  lng: number,
  radiusKm = 5,
  limit = 5,
): Promise<WalkTrail[]> => {
  const res = await axios.get(`${prefix}/nearby`, {
    params: { lat, lng, radiusKm, limit },
  });
  return res.data;
};

export const registerTrail = async (trail: WalkTrail): Promise<number> => {
  const res = await jwtAxios.post(prefix, trail);
  return res.data.result;
};
