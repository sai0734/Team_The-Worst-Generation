import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../store";
import { setCurrentBaby } from "../../slices/babySlice";
import * as babyInfoApi from "../../api/babyInfoApi";
import { BabyInfo } from "../../api/babyInfoApi";
import BasicLayout from "../../layouts/BasicLayout";
import CryCheckRecorderComponent from "../../components/cryCheck/CryCheckRecorderComponent";
import CryCheckHistoryComponent from "../../components/cryCheck/CryCheckHistoryComponent";
import "../../styles/cryCheck.css";

const CryCheckPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentBaby = useSelector(
    (state: RootState) => state.babySlice.currentBaby,
  );
  const [babyList, setBabyList] = useState<BabyInfo[]>([]);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    babyInfoApi.getList().then((list: BabyInfo[]) => {
      setBabyList(list);

      if (currentBaby) return;

      if (list.length === 0) {
        alert("등록된 아이가 없습니다. 먼저 아이를 등록해주세요.");
        navigate("/babyInfo/input");
        return;
      }

      dispatch(setCurrentBaby(list[0]));
    });
  }, []);

  const handleAnalyzed = () => {
    setReloadTrigger((prev) => prev + 1);
  };

  if (!currentBaby) {
    return (
      <BasicLayout>
        <div>불러오는 중...</div>
      </BasicLayout>
    );
  }

  return (
    <BasicLayout>
      <div className="cry-check-page">
        {babyList.length > 1 && (
          <div className="cry-check-mode-tabs">
            {babyList.map((baby) => (
              <button
                key={baby.babyNo}
                type="button"
                onClick={() => dispatch(setCurrentBaby(baby))}
                className={`chip${baby.babyNo === currentBaby.babyNo ? " is-active" : ""}`}
              >
                {baby.babyName}
              </button>
            ))}
          </div>
        )}

        <CryCheckRecorderComponent onAnalyzed={handleAnalyzed} />
        <CryCheckHistoryComponent reloadTrigger={reloadTrigger} />
      </div>
    </BasicLayout>
  );
};

export default CryCheckPage;
