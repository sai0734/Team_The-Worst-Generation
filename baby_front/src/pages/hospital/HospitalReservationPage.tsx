import { Navigate } from "react-router-dom";
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
      <section className="hospital-reservation-placeholder">
        <p>ai랑 연동 페이지 할곳</p>
      </section>
    </BasicLayout>
  );
};

export default HospitalReservationPage;
