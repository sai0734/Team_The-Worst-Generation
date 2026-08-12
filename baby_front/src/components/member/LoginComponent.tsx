import { useState, type ChangeEvent } from "react";
import { useLocation } from "react-router-dom";
import useCustomLogin from "../../hooks/useCustomLogin";
import KakaoLoginComponent from "./KakaoLoginComponent";
import { linkKakaoMember } from "../../api/kakaoApi";
import type {
  AuthError,
  LoginParam,
  SocialLoginNavigationState,
} from "../../types/member";

const initState: LoginParam = {
  email: "",
  pw: "",
};

const isAuthError = (error: unknown): error is AuthError => {
  return typeof error === "object" && error !== null && "error" in error;
};

const LoginComponent = () => {
  const location = useLocation();
  const socialLoginState =
    location.state as SocialLoginNavigationState | null;
  const [loginParam, setLoginParam] = useState<LoginParam>({
    ...initState,
    email: socialLoginState?.email ?? "",
  });

  const { doLogin, moveToPath } = useCustomLogin();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLoginParam({ ...loginParam, [e.target.name]: e.target.value });
  };

  const handleClickLogin = async () => {
    try {
      await doLogin(loginParam);

      if (socialLoginState?.socialLinkToken) {
        await linkKakaoMember(socialLoginState.socialLinkToken);
        alert("카카오 계정 연동 성공");
        moveToPath("/");
        return;
      }

      alert("로그인 성공");
      moveToPath("/");
    } catch (error: unknown) {
      if (isAuthError(error) && error.error === "ERROR_LOGIN") {
        alert("이메일과 패스워드를 다시 확인하세요");
        return;
      }

      alert("로그인 중 오류가 발생했습니다");
    }
  };

  return (
    <div className="w-full max-w-md border border-neutral-300 bg-white p-8">
      <div className="mb-6 text-center text-2xl font-bold">로그인</div>

      <div className="mb-4">
        <label className="mb-2 block" htmlFor="login-email">
          이메일
        </label>
        <input
          className="w-full border border-neutral-300 p-3"
          id="login-email"
          name="email"
          type="email"
          value={loginParam.email}
          onChange={handleChange}
          readOnly={Boolean(socialLoginState?.email)}
        />
      </div>

      <div className="mb-4">
        <label className="mb-2 block" htmlFor="login-password">
          비밀번호
        </label>
        <input
          className="w-full border border-neutral-300 p-3"
          id="login-password"
          name="pw"
          type="password"
          value={loginParam.pw}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          className="w-full border border-neutral-400 p-3"
          onClick={handleClickLogin}
        >
          로그인
        </button>
        <button
          type="button"
          className="w-full border border-neutral-400 p-3"
          onClick={() => moveToPath("/member/signup")}
        >
          회원가입
        </button>
      </div>

      <KakaoLoginComponent />
    </div>
  );
};

export default LoginComponent;
