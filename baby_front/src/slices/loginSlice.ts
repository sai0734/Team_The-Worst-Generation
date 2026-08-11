import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { loginPost } from "../api/memberApi";
import { getCookie, removeCookie, setCookie } from "../util/cookieUtil";
import type {
  AuthError,
  LoginParam,
  LoginResponse,
  LoginState,
} from "../types/member";
import axios from "axios";
import { clearAccessToken, setAccessToken } from "../util/accessTokenStore";

const initState: LoginState = {
  email: "",
};

const loadMemberCookie = (): LoginState | undefined => {
  //쿠키에서 로그인 정보 로딩
  const memberInfo: LoginState | undefined = getCookie("member");

  //닉네임 처리하여 사용자가 입력한 값중에 특수문자나 공백이 포함되면 디코딩하여 제대로 된 형태로 표시
  if (memberInfo && memberInfo.nickname) {
    memberInfo.nickname = decodeURIComponent(memberInfo.nickname);
  }
  return memberInfo;
};
export const loginPostAsync = createAsyncThunk<
  LoginResponse,
  LoginParam,
  { rejectValue: AuthError }
>("loginPostAsync", async (param, { rejectWithValue }) => {
  try {
    return await loginPost(param);
  } catch (error: unknown) {
    if (axios.isAxiosError<{ error: string }>(error)) {
      return rejectWithValue(
        error.response?.data ?? { error: "UNKNOWN_ERROR" },
      );
    }

    return rejectWithValue({ error: "UNKNOWN_ERROR" });
  }
});

const applyLoginResponse = (payload: LoginResponse): LoginState => {
  const { accessToken, email, nickname, social, roleNames } = payload;
  const memberInfo: LoginState = {
    email,
    nickname,
    social,
    roleNames,
  };

  setAccessToken(accessToken);
  setCookie("member", JSON.stringify(memberInfo), 1);

  return memberInfo;
};

const loginSlice = createSlice({
  name: "LoginSlice",
  initialState: loadMemberCookie() || initState, // 쿠키가 없다면 초깃값 사용
  reducers: {
    login: (_state, action: PayloadAction<LoginResponse>) => {
      console.log("login....");
      // 소셜 로그인이 사용
      return applyLoginResponse(action.payload);
    },
    logout: () => {
      console.log("logout....");

      clearAccessToken();
      removeCookie("member");

      return { ...initState };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginPostAsync.fulfilled, (_state, action) => {
        console.log("fulfilled");
        return applyLoginResponse(action.payload);
      })
      .addCase(loginPostAsync.pending, () => {
        console.log("pending");
      })
      .addCase(loginPostAsync.rejected, () => {
        console.log("rejected");
      });
  },
});
export const { login, logout } = loginSlice.actions;
export default loginSlice.reducer;
