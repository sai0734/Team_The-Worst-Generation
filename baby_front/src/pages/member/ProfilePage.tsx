import ProfileManager from "../../components/member/profile/ProfileManager";
import BasicLayout from "../../layouts/BasicLayout";
import "../../styles/member.css";
import useCustomLogin from "../../hooks/useCustomLogin";

const ProfilePage = () => {
  const { isLogin, moveToLoginReturn } = useCustomLogin();
  if (!isLogin) return moveToLoginReturn();

  return <BasicLayout><ProfileManager /></BasicLayout>;
};

export default ProfilePage;
