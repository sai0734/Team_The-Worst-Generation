import { Navigate } from "react-router-dom";
import HospitalReservationComponent from "../../components/hospital/HospitalReservationComponent";
import useCurrentProfile from "../../hooks/useCurrentProfile";
import useCustomLogin from "../../hooks/useCustomLogin";
import BasicLayout from "../../layouts/BasicLayout";
import SkyBackground from "../../components/common/SkyBackground";
import "../../styles/hospital.css";

const HospitalReservationPage = () => {
  const { isLogin, moveToLoginReturn } = useCustomLogin();
  const currentProfile = useCurrentProfile();

  if (!isLogin) return moveToLoginReturn();
  if (!currentProfile) return <Navigate replace to="/member/profiles" />;

  return (
    <BasicLayout>
      <SkyBackground />
      <div className="page-sky-content">
        <HospitalReservationComponent />
      </div>
    </BasicLayout>
  );
};

export default HospitalReservationPage;
