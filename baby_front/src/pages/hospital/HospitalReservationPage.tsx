import { Navigate } from "react-router-dom";
import HospitalReservationComponent from "../../components/hospital/HospitalReservationComponent";
import useCurrentProfile from "../../hooks/useCurrentProfile";
import useCustomLogin from "../../hooks/useCustomLogin";
import BasicLayout from "../../layouts/BasicLayout";
import "../../styles/hospital.css";

const HospitalReservationPage = () => {
  const { isLogin, moveToLoginReturn } = useCustomLogin();
  const currentProfile = useCurrentProfile();

  if (!isLogin) return moveToLoginReturn();
  if (!currentProfile) return <Navigate replace to="/member/profiles" />;

  return (
    <BasicLayout>
      <HospitalReservationComponent />
    </BasicLayout>
  );
};

export default HospitalReservationPage;
