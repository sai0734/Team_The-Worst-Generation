import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../store";
import { setCurrentBaby } from "../../slices/babySlice";
import * as babyInfoApi from "../../api/babyInfoApi";
import { BabyInfo } from "../../api/babyInfoApi";
import BasicLayout from "../../layouts/BasicLayout";
import AlbumUploadComponent from "../../components/album/AlbumUploadComponent";
import AlbumGridComponent from "../../components/album/AlbumGridComponent";

const AlbumPage = () => {
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

  const handleRegistered = () => {
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
      <div>
        <span>{currentBaby.babyName}의 성장앨범</span>
      </div>
      {babyList.length > 1 && (
        <div>
          {babyList.map((baby) => (
            <button
              key={baby.babyNo}
              type="button"
              onClick={() => dispatch(setCurrentBaby(baby))}
              className={
                baby.babyNo === currentBaby.babyNo
                  ? "bg-black text-white"
                  : "bg-white text-black"
              }
            >
              {baby.babyName}
            </button>
          ))}
        </div>
      )}
      <AlbumUploadComponent onRegistered={handleRegistered} />
      <AlbumGridComponent reloadTrigger={reloadTrigger} />
    </BasicLayout>
  );
};

export default AlbumPage;
