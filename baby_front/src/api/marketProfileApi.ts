import jwtAxios from "../util/jwtUtil";

const API_SERVER_HOST = "http://localhost:8080";
const prefix = `${API_SERVER_HOST}/api/market/profile`;

// MarketProfileDTO
export interface MarketProfile {
  email: string;
  mannerTemp: number;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  locationVerified: boolean;
  nickname?: string;
}

export const getMyProfile = async (): Promise<MarketProfile> => {
  const res = await jwtAxios.get(`${prefix}/`);
  return res.data;
};

// /{email} 은 anyRequest().authenticated() 대상이라 로그인 상태여야 호출 가능 (jwtAxios 필요)
export const getProfile = async (email: string): Promise<MarketProfile> => {
  const res = await jwtAxios.get(`${prefix}/${email}`);
  return res.data;
};

export const modifyProfile = async (
  Profile: Pick<MarketProfile, "locationName" | "latitude" | "longitude">,
): Promise<void> => {
  await jwtAxios.put(`${prefix}/`, Profile);
};

export const verifyLocation = async (): Promise<void> => {
  await jwtAxios.put(`${prefix}/verify-location`);
};

export const changeNickname = async (nickname: string): Promise<void> => {
  await jwtAxios.put(`${prefix}/nickname`, { nickname });
};
