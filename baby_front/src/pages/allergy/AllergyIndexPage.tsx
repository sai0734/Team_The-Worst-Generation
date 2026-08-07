import { useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import BasicLayout from "../../layouts/BasicLayout";
import * as babyInfoApi from "../../api/babyInfoApi";
import type { BabyInfo } from "../../api/babyInfoApi";

const AllergyIndexPage = () => {
  const navigate = useNavigate();

  const goWithBaby = useCallback(
    async (path: "check" | "custom") => {
      const list: BabyInfo[] = await babyInfoApi.getList();

      if (list.length === 0) {
        alert("등록된 아이가 없습니다. 먼저 아이를 등록해주세요.");
        return;
      }

      navigate({ pathname: `${path}/${list[0].babyNo}` });
    },
    [navigate],
  );

  return (
    <BasicLayout>
      <div className="mb-4 flex gap-4 text-sm font-semibold text-gray-700">
        <span onClick={() => goWithBaby("check")}>성분 검사</span>
        <span onClick={() => goWithBaby("custom")}>추가 알레르기 관리</span>
        <span onClick={() => navigate({ pathname: "ingredient" })}>
          알레르기 유발 성분
        </span>
      </div>
      <Outlet />
    </BasicLayout>
  );
};

export default AllergyIndexPage;
