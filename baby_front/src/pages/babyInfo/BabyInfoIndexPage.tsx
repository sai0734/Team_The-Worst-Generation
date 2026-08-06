import { Outlet, useNavigate } from "react-router-dom";
import BasicLayout from "../../layouts/BasicLayout";
import { useCallback } from "react";

const BabyInfoIndexPage = () => {
  const navigate = useNavigate();

  const handleClickDashboard = useCallback(() => {
    navigate({ pathname: "dashboard" });
  }, [navigate]);

  const handleClickInput = useCallback(() => {
    navigate({ pathname: "input" });
  }, [navigate]);

  return (
    <BasicLayout>
      <div onClick={handleClickDashboard}>대시보드</div>
      <div onClick={handleClickInput}>아이등록</div>
      <Outlet />
    </BasicLayout>
  );
};

export default BabyInfoIndexPage;
