import LoginComponent from "../../components/member/LoginComponent";
import BasicLayout from "../../layouts/BasicLayout";
import "../../styles/member.css";

const LoginPage = () => {
  return (
    <BasicLayout>
      <div className="member-login-page">
        <LoginComponent />
      </div>
    </BasicLayout>
  );
};

export default LoginPage;
