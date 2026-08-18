import { DragEvent, useState } from "react";
import useCustomBabyGuard from "../../hooks/useCustomBabyGuard";
import { BabyDiary } from "../../api/diaryApi";
import * as diaryApi from "../../api/diaryApi";
import * as aiVideoApi from "../../api/aiVideoApi";
import AiVideoDiarySelectComponent from "../../components/aiVideo/AiVideoDiarySelectComponent";
import AiVideoResultComponent from "../../components/aiVideo/AiVideoResultComponent";

const AiVideoPage = () => {
  const { currentBaby } = useCustomBabyGuard();
  const [selectedDiary, setSelectedDiary] = useState<BabyDiary | null>(null);
  const [videoPhoto, setVideoPhoto] = useState<File | null>(null);
  const [videoPhotoPreview, setVideoPhotoPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSelectDiary = (diary: BabyDiary) => {
    setSelectedDiary(diary);
    setVideoPhoto(null);
    setVideoPhotoPreview(null);
  };

  const applyVideoPhoto = (file: File | null) => {
    setVideoPhoto(file);
    setVideoPhotoPreview(file ? URL.createObjectURL(file) : null);
  };

  const needsPhoto = !!selectedDiary && !selectedDiary.photoFileName;
  const canGenerate = !!selectedDiary && (!!selectedDiary.photoFileName || !!videoPhoto);

  const getImageFile = async (): Promise<File | null> => {
    if (videoPhoto) return videoPhoto;

    if (selectedDiary?.photoFileName) {
      const res = await fetch(diaryApi.getViewUrl(selectedDiary.photoFileName));
      const blob = await res.blob();
      return new File([blob], selectedDiary.photoFileName, { type: blob.type });
    }

    return null;
  };

  const pollStatus = (taskId: string) => {
    const intervalId = setInterval(async () => {
      try {
        const result = await aiVideoApi.checkStatus(taskId);

        if (result.status === "succeed") {
          clearInterval(intervalId);
          setVideoUrl(result.videoUrl);
          setIsGenerating(false);
        } else if (result.status === "failed") {
          clearInterval(intervalId);
          alert("영상 생성에 실패했습니다.");
          setIsGenerating(false);
        }
      } catch (err) {
        clearInterval(intervalId);
        alert("상태 확인 중 오류가 발생했습니다.");
        console.error(err);
        setIsGenerating(false);
      }
    }, 5000);
  };

  const handleGenerate = async () => {
    if (!selectedDiary) return;

    const imageFile = await getImageFile();
    if (!imageFile) {
      alert("사진이 필요합니다.");
      return;
    }

    setIsGenerating(true);
    setVideoUrl(null);

    try {
      const { taskId } = await aiVideoApi.generate(selectedDiary.content, imageFile);
      pollStatus(taskId);
    } catch (err) {
      alert("영상 생성 요청에 실패했습니다.");
      console.error(err);
      setIsGenerating(false);
    }
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
        onSelect={handleSelectDiary}
      />

      {needsPhoto && (
        <div className="flex flex-col gap-3 rounded-[20px] border border-[rgba(42,41,38,0.1)] bg-[#FAF6F0] p-4 sm:flex-row sm:items-center sm:p-6">
          <div
            className={`relative h-[160px] w-full flex-shrink-0 rounded-[16px] sm:w-[160px] ${
              isDragOver ? "ring-4 ring-[#5AB2FF] ring-offset-2" : ""
            }`}
            onDragOver={(e: DragEvent<HTMLDivElement>) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e: DragEvent<HTMLDivElement>) => {
              e.preventDefault();
              setIsDragOver(false);

              const dropped = e.dataTransfer.files?.[0] ?? null;
              if (dropped && !dropped.type.startsWith("image/")) {
                alert("이미지 파일만 등록할 수 있습니다.");
                return;
              }
              applyVideoPhoto(dropped);
            }}
          >
            {videoPhotoPreview ? (
              <img
                className="h-full w-full rounded-[16px] object-cover border-4 border-[#CAF4FF]"
                src={videoPhotoPreview}
                alt="미리보기"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-[16px] bg-gradient-to-br from-[#A0DEFF] to-[#5AB2FF] text-white">
                <span className="text-2xl font-bold leading-none">+</span>
                <span className="text-xs font-bold">사진 추가</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 cursor-pointer rounded-[16px] opacity-0"
              onChange={(e) => {
                const selected = e.target.files?.[0] ?? null;
                applyVideoPhoto(selected);
              }}
            />
            {videoPhotoPreview && (
              <button
                type="button"
                className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-[#7A756C] shadow transition-colors hover:bg-[#f3d9d9] hover:text-[#c0392b]"
                onClick={(e) => {
                  e.stopPropagation();
                  applyVideoPhoto(null);
                }}
              >
                ✕
              </button>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-bold text-[#2A2926]">
              아이 얼굴이 나온 사진을 올려주세요
            </p>
            <p className="text-xs text-[#7A756C]">
              이 일기엔 사진이 없어서 영상에 쓸 사진이 따로 필요해요. 아이
              얼굴이 잘 보이는 사진일수록 자연스러운 영상이 만들어져요.
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleGenerate}
        disabled={!canGenerate || isGenerating}
        className="self-end rounded-full bg-[#7F77DD] px-6 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isGenerating ? "생성 중..." : "영상 만들기"}
      </button>

      <AiVideoResultComponent videoUrl={videoUrl} />
    </div>
  );
};

export default AiVideoPage;
