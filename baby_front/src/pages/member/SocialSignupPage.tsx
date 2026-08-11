import axios from "axios";
import { useState, type ChangeEvent } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { signupAndLinkSocial } from "../../api/kakaoApi";
import BasicMenu from "../../components/menus/BasicMenu";
import { login } from "../../slices/loginSlice";
import type { AppDispatch } from "../../store";
import type {
  SocialLoginNavigationState,
  SocialSignupParam,
} from "../../types/member";

const SocialSignupPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const socialLoginState =
    location.state as SocialLoginNavigationState | null;

  const [signupParam, setSignupParam] = useState<SocialSignupParam>({
    email: socialLoginState?.email ?? "",
    pw: "",
    nickname: "",
    socialLinkToken: socialLoginState?.socialLinkToken ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSignupParam({
      ...signupParam,
      [event.target.name]: event.target.value,
    });
  };

  const handleSignup = async () => {
    if (
      !signupParam.email.trim() ||
      !signupParam.pw.trim() ||
      !signupParam.nickname.trim() ||
      !signupParam.socialLinkToken
    ) {
      setErrorMessage("이메일, 비밀번호, 닉네임을 모두 입력해주세요.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const loginResponse = await signupAndLinkSocial(signupParam);
      dispatch(login(loginResponse));
      alert("회원가입과 카카오 연동이 완료되었습니다.");
      navigate("/", { replace: true });
    } catch (error: unknown) {
      if (axios.isAxiosError<{ error?: string }>(error)) {
        setErrorMessage(
          error.response?.data?.error ?? "회원가입 중 오류가 발생했습니다.",
        );
      } else {
        setErrorMessage("회원가입 중 오류가 발생했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!socialLoginState?.socialLinkToken) {
    return (
      <div className="p-6">
        카카오 연동 정보가 없습니다. 카카오 로그인을 다시 시도해주세요.
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 flex h-full w-full flex-col">
      <BasicMenu />
      <div className="flex h-full w-full items-center justify-center">
        <div className="m-2 w-full max-w-xl border-2 border-sky-200 p-6">
          <h1 className="mb-6 text-center text-3xl font-bold">
            소셜 회원가입
          </h1>

          <label className="mb-4 block">
            <span className="mb-2 block font-bold">Email</span>
            <input
              className="w-full rounded border border-neutral-400 p-3"
              name="email"
              type="email"
              value={signupParam.email}
              onChange={handleChange}
              readOnly={Boolean(socialLoginState.email)}
            />
          </label>

          <label className="mb-4 block">
            <span className="mb-2 block font-bold">Password</span>
            <input
              className="w-full rounded border border-neutral-400 p-3"
              name="pw"
              type="password"
              value={signupParam.pw}
              onChange={handleChange}
            />
          </label>

          <label className="mb-4 block">
            <span className="mb-2 block font-bold">Nickname</span>
            <input
              className="w-full rounded border border-neutral-400 p-3"
              name="nickname"
              type="text"
              value={signupParam.nickname}
              onChange={handleChange}
            />
          </label>

          {errorMessage && (
            <div className="mb-4 text-red-500">{errorMessage}</div>
          )}

          <button
            className="w-full rounded bg-blue-500 p-3 font-bold text-white disabled:opacity-50"
            type="button"
            disabled={submitting}
            onClick={handleSignup}
          >
            {submitting ? "처리 중..." : "회원가입"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SocialSignupPage;
