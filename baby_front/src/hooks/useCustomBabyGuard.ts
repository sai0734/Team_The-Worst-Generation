import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../store";
import * as babyInfoApi from "../api/babyInfoApi";
import { BabyInfo } from "../api/babyInfoApi";
import { setCurrentBaby } from "../slices/babySlice";

const useCustomBabyGuard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentBaby = useSelector(
    (state: RootState) => state.babySlice.currentBaby,
  );

  const [babyList, setBabyList] = useState<BabyInfo[]>([]);

  useEffect(() => {
    babyInfoApi.getList().then((list: BabyInfo[]) => {
      setBabyList(list);

      const stillExists =
        currentBaby && list.some((baby) => baby.babyNo === currentBaby.babyNo);
      if (stillExists) return;

      if (list.length === 0) {
        alert("등록된 아이가 없습니다. 먼저 아이를 등록해주세요.");
        navigate("/babyInfo/input");
        return;
      }

      dispatch(setCurrentBaby(list[0]));
    });
  }, []);

  return { currentBaby, babyList };
};

export default useCustomBabyGuard;
