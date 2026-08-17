import jwtAxios from "../util/jwtUtil";
import { setAccessToken } from "../util/accessTokenStore";
import { syncAuthStateFromAccessToken } from "../util/authStateSync";
import type {
  MemberProfile,
  ProfileCreateResponse,
  ProfileResultResponse,
  ProfileSaveRequest,
  ProfileSelectRequest,
  ProfileSelectResponse,
} from "../types/profile";

const API_SERVER_HOST = "http://localhost:8080";
const profileHost = `${API_SERVER_HOST}/api/member/profiles`;

export const getMyProfiles = async (): Promise<MemberProfile[]> => {
  const response = await jwtAxios.get<MemberProfile[]>(profileHost);
  return response.data;
};

export const createProfile = async (
  profile: ProfileSaveRequest,
): Promise<ProfileCreateResponse> => {
  const response = await jwtAxios.post<ProfileCreateResponse>(
    profileHost,
    profile,
  );
  return response.data;
};

export const getProfile = async (
  profileId: number,
): Promise<MemberProfile> => {
  const response = await jwtAxios.get<MemberProfile>(
    `${profileHost}/${profileId}`,
  );
  return response.data;
};

export const updateProfile = async (
  profileId: number,
  profile: ProfileSaveRequest,
): Promise<ProfileResultResponse> => {
  const response = await jwtAxios.put<ProfileResultResponse>(
    `${profileHost}/${profileId}`,
    profile,
  );
  return response.data;
};

export const deleteProfile = async (
  profileId: number,
): Promise<ProfileResultResponse> => {
  const response = await jwtAxios.delete<ProfileResultResponse>(
    `${profileHost}/${profileId}`,
  );
  return response.data;
};

export const selectProfile = async (
  request: ProfileSelectRequest,
): Promise<ProfileSelectResponse> => {
  const response = await jwtAxios.post<ProfileSelectResponse>(
    `${profileHost}/select`,
    request,
  );

  setAccessToken(response.data.accessToken);
  syncAuthStateFromAccessToken(response.data.accessToken);

  return response.data;
};
