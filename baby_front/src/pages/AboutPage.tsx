import useCustomLogin from "../hooks/useCustomLogin";
import BasicLayout from "../layouts/BasicLayout";
import SkyBackground from "../components/common/SkyBackground";
const AboutPage = () => {
  const { isLogin, moveToLoginReturn } = useCustomLogin();

  if (!isLogin) {
    return moveToLoginReturn();
  }
  return (
    <BasicLayout>
      <SkyBackground />
      <div className="page-sky-content">
        <div className="text-3xl">About Page</div>
      </div>
    </BasicLayout>
  );
};

export default AboutPage;
