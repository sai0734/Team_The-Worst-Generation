import MyPageComponent from "../../components/member/MyPageComponent";
import BasicLayout from "../../layouts/BasicLayout";
import SkyBackground from "../../components/common/SkyBackground";
import "../../styles/member.css";
import useCustomLogin from "../../hooks/useCustomLogin";

const MyPage = () => {
  const { isLogin, moveToLoginReturn } = useCustomLogin();
  if (!isLogin) return moveToLoginReturn();

  return (
    <BasicLayout>
      <SkyBackground />
      <div className="page-sky-content">
        <MyPageComponent />
      </div>
    </BasicLayout>
  );
};

export default MyPage;
