import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { loginPost } from "../api/memberApi";
import { getCookie, removeCookie, setCookie } from "../util/cookieUtil";
import type { LoginParam, LoginState } from "../types/member";

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
export const loginPostAsync = createAsyncThunk(
  "loginPostAsync",
  (param: LoginParam) => {
    return loginPost(param);
  },
);

const loginSlice = createSlice({
  name: "LoginSlice",
  initialState: loadMemberCookie() || initState, // 쿠키가 없다면 초깃값 사용
  reducers: {
    login: (_state, action: PayloadAction<LoginState>) => {
      console.log("login....");
      // 소셜 로그인 회원이 사용
      const payload = action.payload;
      setCookie("member", JSON.stringify(payload), 1); // 1일

      return payload;
    },
    logout: () => {
      console.log("logout....");
      removeCookie("member");
      return { ...initState };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(
        loginPostAsync.fulfilled,
        (_state, action: PayloadAction<LoginState>) => {
          console.log("fulfilled");
          const payload = action.payload;

          // 정상적인 로그인시에만 저장
          if (!payload.error) {
            setCookie("member", JSON.stringify(payload), 1); //1일
            // setCookie("member", JSON.stringify(payload),1/24)
          }

          return payload;
        },
      )
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
