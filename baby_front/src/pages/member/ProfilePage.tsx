import ProfileManager from "../../components/member/profile/ProfileManager";
import BasicLayout from "../../layouts/BasicLayout";
import SkyBackground from "../../components/common/SkyBackground";
import "../../styles/member.css";
import useCustomLogin from "../../hooks/useCustomLogin";

const ProfilePage = () => {
  const { isLogin, moveToLoginReturn } = useCustomLogin();
  if (!isLogin) return moveToLoginReturn();

  return (
    <BasicLayout>
      <SkyBackground />
      <div className="page-sky-content">
        <ProfileManager />
      </div>
    </BasicLayout>
  );
};

export default ProfilePage;
