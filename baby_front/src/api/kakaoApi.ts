import axios from "axios";
import { API_SERVER_HOST } from "./todoApi";
import type { LoginState } from "../types/member";

const rest_api_key = ``; // rest키값
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
  const params = {
    grant_type: "authorization_code",
    client_id: rest_api_key,
    redirect_uri: redirect_uri,
    code: authCode,
  };

  const res = await axios.post(access_token_url, params, header);

  const accessToken = res.data.access_token;

  return accessToken;
};

export const getMemberWithAccessToken = async (
  accessToken: string,
): Promise<LoginState> => {
  const res = await axios.get(
    `${API_SERVER_HOST}/api/member/kakao?accessToken=${accessToken}`,
  );

  return res.data;
};
