import LoginComponent from "../../components/member/LoginComponent";
import BasicLayout from "../../layouts/BasicLayout";
import SkyBackground from "../../components/common/SkyBackground";
import "../../styles/member.css";

const LoginPage = () => {
  return (
    <BasicLayout>
      <SkyBackground />
      <div className="member-login-page page-sky-content">
        <LoginComponent />
      </div>
    </BasicLayout>
  );
};

export default LoginPage;
