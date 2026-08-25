import HospitalHomeComponent from "../../components/hospital/HospitalHomeComponent";
import useCustomLogin from "../../hooks/useCustomLogin";
import BasicLayout from "../../layouts/BasicLayout";
import SkyBackground from "../../components/common/SkyBackground";
import "../../styles/hospital.css";
import useCurrentProfile from "../../hooks/useCurrentProfile";
import { Navigate } from "react-router-dom";

const HospitalPage = () => {
  const { isLogin, moveToLoginReturn } = useCustomLogin();
  const currentProfile = useCurrentProfile();
  if (!isLogin) return moveToLoginReturn();
  if (!currentProfile) return <Navigate replace to="/member/profiles" />;

  return (
    <BasicLayout>
      <SkyBackground />
      <div className="page-sky-content">
        <HospitalHomeComponent />
      </div>
    </BasicLayout>
  );
};

export default HospitalPage;
