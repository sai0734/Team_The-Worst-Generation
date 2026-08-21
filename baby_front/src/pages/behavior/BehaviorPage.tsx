import { useState } from "react";
import { useDispatch } from "react-redux";
import { setCurrentBaby } from "../../slices/babySlice";
import useCustomBabyGuard from "../../hooks/useCustomBabyGuard";
import BehaviorInputComponent from "../../components/behavior/BehaviorInputComponent";
import BehaviorAnswerComponent from "../../components/behavior/BehaviorAnswerComponent";
import BehaviorHistoryComponent from "../../components/behavior/BehaviorHistoryComponent";
import { BehaviorConsult } from "../../api/behaviorApi";

const BehaviorPage = () => {
  const dispatch = useDispatch();
  const { currentBaby, babyList } = useCustomBabyGuard();
  const [activeConsult, setActiveConsult] = useState<BehaviorConsult | null>(
    null,
  );
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const handleCreated = (consult: BehaviorConsult) => {
    setActiveConsult(consult);
    setReloadTrigger((prev) => prev + 1);
  };

  if (!currentBaby) {
    return <div>불러오는 중...</div>;
  }

  return (
    <div className="max-w-[900px] mx-auto flex flex-col gap-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold tracking-[3px] text-[#5AB2FF]">
            AI BEHAVIOR
          </p>
          <h1 className="mt-1 text-[24px] font-bold text-[#2A2926]">
            {currentBaby.babyName}의 행동교정 상담
          </h1>
        </div>
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
      </div>
      <BehaviorInputComponent onCreated={handleCreated} />
      {activeConsult && <BehaviorAnswerComponent consult={activeConsult} />}
      <BehaviorHistoryComponent reloadTrigger={reloadTrigger} />
    </div>
  );
};

export default BehaviorPage;
