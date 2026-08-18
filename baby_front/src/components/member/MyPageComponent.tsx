import { useNavigate } from "react-router-dom";
import useCurrentProfile from "../../hooks/useCurrentProfile";
import useCustomLogin from "../../hooks/useCustomLogin";
import KakaoLinkPanel from "./KakaoLinkPanel";
import PasswordChangePanel from "./PasswordChangePanel";
import ProfileAvatar from "./profile/ProfileAvatar";

const MyPageComponent = () => {
  const navigate = useNavigate();
  const currentProfile = useCurrentProfile();
  const { loginState } = useCustomLogin();
  const currentProfileType = currentProfile?.parentType === "FATHER" ? "아빠" : "엄마";

  return (
    <section className="mypage-shell">
      <div className="mypage-heading">
        <p className="eyebrow">MY ACCOUNT</p>
        <h1>마이페이지</h1>
        <p className="desc">계정과 가족 프로필을 한곳에서 관리하세요.</p>
      </div>

      <section className="card mypage-account-card">
        {currentProfile ? (
          <ProfileAvatar profileName={currentProfile.profileName} parentType={currentProfile.parentType} />
        ) : (
          <div className="profile-avatar"><span>나</span></div>
        )}
        <div className="mypage-account-copy">
          <span>{currentProfile ? "현재 사용 중인 프로필" : "로그인 계정"}</span>
          <h2>{currentProfile?.profileName ?? loginState.nickname ?? "회원"}</h2>
          <p>{currentProfile ? `${currentProfileType} 프로필 · ${loginState.email}` : loginState.email}</p>
        </div>
        {currentProfile && <span className="chip">사용 중</span>}
      </section>

      <div className="mypage-grid">
        <section className="card mypage-panel mypage-profile-panel">
          <div className="mypage-panel-heading">
            <div className="mypage-panel-icon">♧</div>
            <div><h2>프로필 변경·수정</h2></div>
          </div>
          <button type="button" className="ghost-btn" onClick={() => navigate("/member/profiles")}>프로필 관리</button>
        </section>
        <KakaoLinkPanel />
        <PasswordChangePanel />
      </div>
    </section>
  );
};

export default MyPageComponent;
