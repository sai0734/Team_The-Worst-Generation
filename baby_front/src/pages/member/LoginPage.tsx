import LoginComponent from "../../components/member/LoginComponent";
import BasicLayout from "../../layouts/BasicLayout";

const LoginPage = () => {
  return (
    <BasicLayout>
      <div className="flex min-h-[70vh] items-center justify-center">
        <LoginComponent />
      </div>
    </BasicLayout>
  );
};

export default LoginPage;
