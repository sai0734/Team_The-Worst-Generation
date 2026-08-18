import { useState } from "react";
import useCustomBabyGuard from "../../hooks/useCustomBabyGuard";
import { BabyDiary } from "../../api/diaryApi";
import AiVideoDiarySelectComponent from "../../components/aiVideo/AiVideoDiarySelectComponent";
import AiVideoResultComponent from "../../components/aiVideo/AiVideoResultComponent";

const AiVideoPage = () => {
  const { currentBaby } = useCustomBabyGuard();
  const [selectedDiary, setSelectedDiary] = useState<BabyDiary | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const handleGenerate = () => {
    alert("영상 생성 기능은 준비 중입니다.");
    setVideoUrl(null);
  };

  if (!currentBaby) {
    return <div>불러오는 중...</div>;
  }

  return (
    <div className="max-w-[900px] mx-auto flex flex-col gap-6 py-4">
      <div>
        <p className="text-[11px] font-extrabold tracking-[3px] text-[#5AB2FF]">
          AI VIDEO
        </p>
        <h1 className="mt-1 text-[24px] font-bold text-[#2A2926]">AI 동영상</h1>
      </div>

      <AiVideoDiarySelectComponent
        selectedDiaryNo={selectedDiary?.diaryNo ?? null}
        onSelect={setSelectedDiary}
      />

      <button
        type="button"
        onClick={handleGenerate}
        disabled={!selectedDiary}
        className="self-end rounded-full bg-[#7F77DD] px-6 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        영상 만들기
      </button>

      <AiVideoResultComponent videoUrl={videoUrl} />
    </div>
  );
};

export default AiVideoPage;
