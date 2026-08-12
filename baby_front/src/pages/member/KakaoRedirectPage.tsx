import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getAccessToken, getMemberWithAccessToken } from "../../api/kakaoApi";
import { login } from "../../slices/loginSlice";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../store";
import type { SocialLoginNavigationState } from "../../types/member";

const KakaoRedirectPage = () => {
  const [searchParams] = useSearchParams();

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const authCode = searchParams.get("code");
  const [message, setMessage] = useState(
    authCode
      ? "카카오 로그인 처리 중입니다."
      : "카카오 인증 코드를 찾을 수 없습니다.",
  );

  useEffect(() => {
    if (!authCode) {
      return;
    }

    const processKakaoLogin = async () => {
      try {
        const accessToken = await getAccessToken(authCode);
        const memberInfo = await getMemberWithAccessToken(accessToken);

        if (memberInfo.status === "LOGIN") {
          dispatch(login(memberInfo));
          navigate("/", { replace: true });
          return;
        }

        const navigationState: SocialLoginNavigationState = {
          email: memberInfo.email,
          socialLinkToken: memberInfo.socialLinkToken,
        };

        if (memberInfo.status === "NEED_ACCOUNT_AUTH") {
          navigate("/member/login", {
            replace: true,
            state: navigationState,
          });
          return;
        }

        navigate("/member/social/signup", {
          replace: true,
          state: navigationState,
        });
      } catch {
        setMessage("카카오 로그인 처리 중 오류가 발생했습니다.");
      }
    };

    void processKakaoLogin();
  }, [authCode, dispatch, navigate]);

  return (
    <div>
      <div>Kakao Login Redirect</div>
      <div>{message}</div>
    </div>
  );
};

export default KakaoRedirectPage;
