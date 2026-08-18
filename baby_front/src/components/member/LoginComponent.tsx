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
        alert("카카오 계정 연동이 완료되었습니다.");
        moveToPath("/member/profiles");
        return;
      }

      moveToPath("/member/profiles");
    } catch (error: unknown) {
      if (isAuthError(error) && error.error === "ERROR_LOGIN") {
        alert("이메일과 비밀번호를 다시 확인해주세요.");
        return;
      }

      alert("로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  return (
    <div className="member-login-shell">
      <div className="member-login-intro">
        <p className="eyebrow">WELCOME BACK</p>
        <h1>우리 가족의 하루를<br />다시 이어가요.</h1>
        <p className="desc">로그인하고 가족 프로필을 선택하면 아이의 기록과 가족 일정을 이어서 관리할 수 있어요.</p>
        <div className="member-login-decoration"><span>아빠</span><span>아이</span><span>엄마</span></div>
      </div>

      <div className="card member-login-card">
        <div className="member-login-card-heading"><p className="eyebrow">MEMBER LOGIN</p><h2>로그인</h2></div>

      <label className="member-login-field" htmlFor="login-email">
        <span>이메일</span>
        <input
          id="login-email"
          name="email"
          type="email"
          value={loginParam.email}
          onChange={handleChange}
          readOnly={Boolean(socialLoginState?.email)}
        />
      </label>

      <label className="member-login-field" htmlFor="login-password">
        <span>비밀번호</span>
        <input
          id="login-password"
          name="pw"
          type="password"
          value={loginParam.pw}
          onChange={handleChange}
        />
      </label>

      <div className="member-login-actions">
        <button
          type="button"
          className="submit-btn"
          onClick={handleClickLogin}
        >
          로그인하기
        </button>
        <button
          type="button"
          className="ghost-btn"
          onClick={() => moveToPath("/member/signup")}
        >
          처음이신가요? 회원가입
        </button>
      </div>

      <KakaoLoginComponent />
      </div>
    </div>
  );
};

export default LoginComponent;
