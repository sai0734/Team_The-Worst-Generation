import HospitalHomeComponent from "../../components/hospital/HospitalHomeComponent";
import useCustomLogin from "../../hooks/useCustomLogin";
import BasicLayout from "../../layouts/BasicLayout";
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
      <HospitalHomeComponent />
    </BasicLayout>
  );
};

export default HospitalPage;
