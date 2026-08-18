import { getKakaoLoginLink } from "../../api/kakaoApi";

export const KAKAO_LINK_INTENT_KEY = "memberKakaoLinkIntent";

const KakaoLinkPanel = () => {
  const handleLink = () => {
    sessionStorage.setItem(KAKAO_LINK_INTENT_KEY, "true");
    window.location.assign(getKakaoLoginLink());
  };

  return (
    <section className="card mypage-panel mypage-kakao-panel">
      <div className="mypage-panel-heading">
        <div className="mypage-panel-icon kakao">K</div>
        <div><h2>카카오 계정 연동</h2></div>
      </div>
      <button type="button" className="mypage-kakao-button" onClick={handleLink}>카카오 계정 연결</button>
    </section>
  );
};

export default KakaoLinkPanel;
