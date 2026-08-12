/// <reference types="vite/client" />

import axios from "axios";
const API_SERVER_HOST = "http://localhost:8080";
import type {
  KakaoLoginResponse,
  KakaoLoginSuccess,
  SocialSignupParam,
} from "../types/member";
import jwtAxios from "../util/jwtUtil";

const rest_api_key = import.meta.env.VITE_KAKAO_REST_API_KEY ?? "";
const redirect_uri = `http://localhost:3000/member/kakao`;

const auth_code_path = `https://kauth.kakao.com/oauth/authorize`;

const access_token_url = `https://kauth.kakao.com/oauth/token`;

export const getKakaoLoginLink = (): string => {
  const kakaoURL = `${auth_code_path}?client_id=${rest_api_key}&redirect_uri=${redirect_uri}&response_type=code`;

  return kakaoURL;
};

export const getAccessToken = async (authCode: string): Promise<string> => {
  const header = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: rest_api_key,
    redirect_uri: redirect_uri,
    code: authCode,
  });

  const res = await axios.post(access_token_url, params, header);

  const accessToken = res.data.access_token;

  return accessToken;
};

export const getMemberWithAccessToken = async (
  accessToken: string,
): Promise<KakaoLoginResponse> => {
  const res = await axios.get(
    `${API_SERVER_HOST}/api/member/kakao`,
    {
      params: { accessToken },
      withCredentials: true,
    },
  );

  return res.data;
};

export const signupAndLinkSocial = async (
  signupParam: SocialSignupParam,
): Promise<KakaoLoginSuccess> => {
  const res = await axios.post(
    `${API_SERVER_HOST}/api/member/social/signup`,
    signupParam,
    { withCredentials: true },
  );

  return res.data;
};

export const linkKakaoMember = async (
  socialLinkToken: string,
): Promise<void> => {
  await jwtAxios.post(`${API_SERVER_HOST}/api/member/social/kakao/link`, {
    socialLinkToken,
  });
};
