import { Outlet, useNavigate } from "react-router-dom";
import BasicLayout from "../../layouts/BasicLayout";
import { useCallback } from "react";
import * as babyInfoApi from "../../api/babyInfoApi";
import { BabyInfo } from "../../api/babyInfoApi";

const BabyInfoIndexPage = () => {
  const navigate = useNavigate();

  const handleClickDashboard = useCallback(async () => {
    const list: BabyInfo[] = await babyInfoApi.getList();

    console.log("babyInfo list:", list);

    if (list.length === 0) {
      alert("등록된 아이가 없습니다. 먼저 아이를 등록해주세요.");
      navigate({ pathname: "input" });
      return;
    }

    navigate({ pathname: `dashboard/${list[0].babyNo}` });
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
