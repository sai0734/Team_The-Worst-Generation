import jwtAxios from "../util/jwtUtil";
import axios from "axios";

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
}

export const getMyProfile = async (): Promise<MarketProfile> => {
  const res = await jwtAxios.get(`${prefix}/`);
  return res.data;
};

export const getProfile = async (email: string): Promise<MarketProfile> => {
  const res = await axios.get(`${prefix}/${email}`);
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
