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

const onResponseError = async (error: unknown) => {
  if (!axios.isAxiosError<{ error?: string }>(error)) {
    return Promise.reject(error);
  }

  const originalRequest = error.config as RetryableRequestConfig | undefined;

  if (
    error.response?.status !== 401 ||
    error.response.data?.error !== "ERROR_ACCESS_TOKEN" ||
    !originalRequest ||
    originalRequest._retry
  ) {
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
