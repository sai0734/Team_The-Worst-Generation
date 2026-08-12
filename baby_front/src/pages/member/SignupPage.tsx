import axios from "axios";
import { useState, type ChangeEvent } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { signupMember } from "../../api/memberApi";
import BasicLayout from "../../layouts/BasicLayout";
import { login } from "../../slices/loginSlice";
import type { AppDispatch } from "../../store";
import type { MemberSignupParam } from "../../types/member";

const initState: MemberSignupParam = {
  email: "",
  pw: "",
  nickname: "",
};

const SignupPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [signupParam, setSignupParam] = useState<MemberSignupParam>(initState);
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
      !signupParam.nickname.trim()
    ) {
      setErrorMessage("이메일, 비밀번호, 닉네임을 모두 입력해주세요.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const loginResponse = await signupMember(signupParam);
      dispatch(login(loginResponse));
      alert("회원가입이 완료되었습니다.");
      navigate("/", { replace: true });
    } catch (error: unknown) {
      if (axios.isAxiosError<{ error?: string }>(error)) {
        const errorCode = error.response?.data?.error;

        if (errorCode === "MEMBER_ALREADY_EXISTS") {
          setErrorMessage("이미 가입된 이메일입니다.");
        } else if (errorCode === "INVALID_SIGNUP_REQUEST") {
          setErrorMessage("입력 내용을 다시 확인해주세요.");
        } else {
          setErrorMessage("회원가입 중 오류가 발생했습니다.");
        }
      } else {
        setErrorMessage("회원가입 중 오류가 발생했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BasicLayout>
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="w-full max-w-md border border-neutral-300 bg-white p-8">
          <h1 className="mb-6 text-center text-2xl font-bold">회원가입</h1>

          <div className="mb-4">
            <label className="mb-2 block" htmlFor="signup-email">
              이메일
            </label>
            <input
              className="w-full border border-neutral-300 p-3"
              id="signup-email"
              name="email"
              type="email"
              value={signupParam.email}
              onChange={handleChange}
            />
          </div>

          <div className="mb-4">
            <label className="mb-2 block" htmlFor="signup-password">
              비밀번호
            </label>
            <input
              className="w-full border border-neutral-300 p-3"
              id="signup-password"
              name="pw"
              type="password"
              value={signupParam.pw}
              onChange={handleChange}
            />
          </div>

          <div className="mb-4">
            <label className="mb-2 block" htmlFor="signup-nickname">
              닉네임
            </label>
            <input
              className="w-full border border-neutral-300 p-3"
              id="signup-nickname"
              name="nickname"
              type="text"
              value={signupParam.nickname}
              onChange={handleChange}
            />
          </div>

          {errorMessage && (
            <div className="mb-4 text-red-500">{errorMessage}</div>
          )}

          <button
            className="w-full border border-neutral-400 p-3 disabled:opacity-50"
            type="button"
            disabled={submitting}
            onClick={handleSignup}
          >
            {submitting ? "처리 중..." : "회원가입"}
          </button>
        </div>
      </div>
    </BasicLayout>
  );
};

export default SignupPage;
