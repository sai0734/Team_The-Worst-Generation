import axios, {
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import type { RefreshResponse } from "../types/member";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "./accessTokenStore";
import { syncAuthStateFromAccessToken } from "./authStateSync";

const API_SERVER_HOST = "http://localhost:8080";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const jwtAxios = axios.create({
  withCredentials: true,
});

let refreshPromise: Promise<string> | null = null;

const refreshJWT = async (): Promise<string> => {
  const response = await axios.post<RefreshResponse>(
    `${API_SERVER_HOST}/api/member/refresh`,
    null,
    { withCredentials: true },
  );

  setAccessToken(response.data.accessToken);
  syncAuthStateFromAccessToken(response.data.accessToken);
  return response.data.accessToken;
};

const getRefreshedAccessToken = (): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = refreshJWT()
      .catch((error: unknown) => {
        clearAccessToken();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

const beforeReq = async (
  config: InternalAxiosRequestConfig,
): Promise<InternalAxiosRequestConfig> => {
  const accessToken = getAccessToken() ?? (await getRefreshedAccessToken());

  config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
};

const requestFail = (error: unknown) => {
  return Promise.reject(error);
};

const onResponseSuccess = (response: AxiosResponse) => {
  return response;
};

// responseType이 "blob"인 요청(예: TTS 오디오)은 401이 나도 에러 바디까지 Blob으로 오기 때문에
// 그냥 .error로 꺼내 보면 항상 undefined임 - 텍스트로 읽어서 JSON으로 직접 파싱해줘야 함
const readErrorCode = async (data: unknown): Promise<string | undefined> => {
  if (data instanceof Blob) {
    try {
      return (JSON.parse(await data.text()) as { error?: string }).error;
    } catch {
      return undefined;
    }
  }
  return (data as { error?: string } | undefined)?.error;
};

const onResponseError = async (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return Promise.reject(error);
  }

  const originalRequest = error.config as RetryableRequestConfig | undefined;

  if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
    return Promise.reject(error);
  }

  const errorCode = await readErrorCode(error.response.data);
  if (errorCode !== "ERROR_ACCESS_TOKEN") {
    return Promise.reject(error);
  }

  originalRequest._retry = true;

  try {
    await getRefreshedAccessToken();
    return jwtAxios(originalRequest);
  } catch (refreshError: unknown) {
    return Promise.reject(refreshError);
  }
};

jwtAxios.interceptors.request.use(beforeReq, requestFail);
jwtAxios.interceptors.response.use(onResponseSuccess, onResponseError);

export default jwtAxios;
