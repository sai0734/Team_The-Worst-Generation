import axios, { type InternalAxiosRequestConfig } from "axios";
import { getCookie, setCookie } from "./cookieUtil";
const API_SERVER_HOST = "http://localhost:8080";
import type { LoginState } from "../types/member";

//
// 로그인 이후 보호 API 호출할 때 마다 JWT를 자동으로 관리해주는 도구용 파일
//

const jwtAxios = axios.create();

// accessToken 만료되면 새 토큰을 받는 함수
const refreshJWT = async (refreshToken: string) => {
  const res = await axios.post(`${API_SERVER_HOST}/api/member/refresh`, null, {
    params: { refreshToken },
  });

  console.log("----------------------");
  console.log(res.data);

  return res.data;
};

// 보호된 API 호출할때마다 실행 되는 곳 (백엔드 전송 전 실행)
const beforeReq = (config: InternalAxiosRequestConfig) => {
  // config 내부에는 :요청 주소, HTTP 메서드, 요청 헤더, 요청 본문 와 같은 정보가 들어있음
  console.log("before request.............");
  const memberInfo: LoginState | undefined = getCookie("member");
  // member로 로그인 정보 가져오기
  if (!memberInfo) {
    console.log("Member NOT FOUND");
    return Promise.reject({ response: { data: { error: "REQUIRE_LOGIN" } } });
    // 실패하면 onResponseError(요청 중단)
  }

  const { accessToken } = memberInfo;

  // 요청 헤더에 accessToken 넣기
  config.headers.Authorization = `Bearer ${accessToken}`;

  //해서 변경된 config 다시 전달
  return config;
  // 성공하면 onResponseSuccess로
};

// 보호 API 호출 실패했을때 실행(현재 에러만 그냥 전달)
const requestFail = (err: unknown) => {
  console.log("request error............");

  return Promise.reject(err);
};

// 보호 API 호출 성공하면 아래 실행(200처리)
const onResponseSuccess = async (res: any) => {
  console.log("before return response...........");
  console.log(res);

  return res;
};

//400응답 처리
const onResponseError = async (err: unknown) => {
  console.log("response fail error.............");
  if (!axios.isAxiosError<{ error?: string }>(err)) {
    return Promise.reject(err);
  }
  const status = err.response?.status; // 401오류 확인용
  const errorCode = err.response?.data?.error; // accessToken 오류인지 확인용
  const originalRequest = err.config as RetryableRequestConfig | undefined; //다시 보낼 요청 없는경우 or 재시도한 요청 확인용

  if (
    status !== 401 ||
    errorCode !== "ERROR_ACCESS_TOKEN" ||
    !originalRequest ||
    originalRequest._retry
  ) {
    return Promise.reject(err);
  }
  originalRequest._retry = true;

  const memberCookieValue: LoginState | undefined = getCookie("member");

  if (!memberCookieValue?.refreshToken) {
    return Promise.reject(err);
  }

  return refreshAndRetryRequest(originalRequest, memberCookieValue);
};

// refresh token으로 재발급 받기
const refreshAndRetryRequest = async (
  originalRequest: RetryableRequestConfig,
  memberCookieValue: LoginState,
) => {
  const refreshToken = memberCookieValue.refreshToken;

  if (!refreshToken) {
    throw new Error("REFRESH_TOKEN_NOT_FOUND");
  }

  const result = await refreshJWT(refreshToken);

  memberCookieValue.accessToken = result.accessToken;
  memberCookieValue.refreshToken = result.refreshToken;

  setCookie("member", JSON.stringify(memberCookieValue), 1);

  return jwtAxios(originalRequest);
};

jwtAxios.interceptors.request.use(beforeReq, requestFail);

jwtAxios.interceptors.response.use(onResponseSuccess, onResponseError);

// Refresh가 무한 반복되는걸 막기 위해 이미 시도했는지 표시
type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export default jwtAxios;
