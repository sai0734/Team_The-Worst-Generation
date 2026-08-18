import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getAccessToken, getMemberWithAccessToken, linkKakaoMember } from "../../api/kakaoApi";
import { login } from "../../slices/loginSlice";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../store";
import type { SocialLoginNavigationState } from "../../types/member";
import { KAKAO_LINK_INTENT_KEY } from "../../components/member/KakaoLinkPanel";
import useCustomLogin from "../../hooks/useCustomLogin";

const KakaoRedirectPage = () => {
  const [searchParams] = useSearchParams();

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLogin } = useCustomLogin();

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
        const isLinkIntent = sessionStorage.getItem(KAKAO_LINK_INTENT_KEY) === "true";

        if (isLinkIntent && isLogin && memberInfo.status !== "LOGIN") {
          await linkKakaoMember(memberInfo.socialLinkToken);
          sessionStorage.removeItem(KAKAO_LINK_INTENT_KEY);
          alert("카카오 계정 연동이 완료되었습니다.");
          navigate("/mypage", { replace: true });
          return;
        }

        if (memberInfo.status === "LOGIN") {
          sessionStorage.removeItem(KAKAO_LINK_INTENT_KEY);
          dispatch(login(memberInfo));
          navigate(isLinkIntent ? "/mypage" : "/member/profiles", { replace: true });
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
        sessionStorage.removeItem(KAKAO_LINK_INTENT_KEY);
        setMessage("카카오 로그인 처리 중 오류가 발생했습니다.");
      }
    };

    void processKakaoLogin();
  }, [authCode, dispatch, isLogin, navigate]);

  return (
    <div>
      <div>Kakao Login Redirect</div>
      <div>{message}</div>
    </div>
  );
};

export default KakaoRedirectPage;
