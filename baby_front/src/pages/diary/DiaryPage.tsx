import { useState } from "react";
import { useDispatch } from "react-redux";
import { setCurrentBaby } from "../../slices/babySlice";
import useCustomBabyGuard from "../../hooks/useCustomBabyGuard";
import DiaryWriteComponent from "../../components/diary/DiaryWriteComponent";
import DiaryListComponent from "../../components/diary/DiaryListComponent";

const DiaryPage = () => {
  const dispatch = useDispatch();
  const { currentBaby, babyList } = useCustomBabyGuard();
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const handleRegistered = () => {
    setReloadTrigger((prev) => prev + 1);
  };

  if (!currentBaby) {
    return <div>불러오는 중...</div>;
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-6 py-4">
      {babyList.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {babyList.map((baby) => (
            <button
              key={baby.babyNo}
              type="button"
              onClick={() => dispatch(setCurrentBaby(baby))}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                baby.babyNo === currentBaby.babyNo
                  ? "bg-[#5AB2FF] text-white"
                  : "border border-[rgba(42,41,38,0.15)] bg-white text-[#2A2926]"
              }`}
            >
              {baby.babyName}
            </button>
          ))}
        </div>
      )}
      <h1 className="page-hero-title">{currentBaby.babyName}의 육아일기</h1>
      <DiaryWriteComponent onRegistered={handleRegistered} />
      <DiaryListComponent reloadTrigger={reloadTrigger} />
    </div>
  );
};

export default DiaryPage;
