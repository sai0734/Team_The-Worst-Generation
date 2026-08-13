import { Outlet, useLocation, useNavigate } from "react-router-dom";
import BasicLayout from "../../layouts/BasicLayout";
import { useCallback, useEffect } from "react";
import * as babyInfoApi from "../../api/babyInfoApi";
import { BabyInfo } from "../../api/babyInfoApi";

const BabyInfoIndexPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const goToDashboard = useCallback(async () => {
    const list: BabyInfo[] = await babyInfoApi.getList();

    if (list.length === 0) {
      alert("등록된 아이가 없습니다. 먼저 아이를 등록해주세요.");
      navigate("input", { replace: true });
      return;
    }

    navigate(`dashboard/${list[0].babyNo}`, { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (
      location.pathname === "/babyInfo" ||
      location.pathname === "/babyInfo/"
    ) {
      goToDashboard();
    }
  }, [location.pathname, goToDashboard]);

  return (
    <BasicLayout>
      <Outlet />
    </BasicLayout>
  );
};

export default BabyInfoIndexPage;
