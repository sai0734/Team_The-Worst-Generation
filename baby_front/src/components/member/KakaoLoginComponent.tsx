import { getKakaoLoginLink } from "../../api/kakaoApi";

const KakaoLoginComponent = () => {
  const link = getKakaoLoginLink();

  return (
    <div className="member-kakao-login">
      <div className="member-login-divider"><span>또는</span></div>
      <a href={link} className="member-kakao-button"><b>K</b><span>카카오로 계속하기</span></a>
    </div>
  );
};

export default KakaoLoginComponent;
