import { DragEvent, useEffect, useRef, useState } from "react";
import { BabyDiary } from "../../api/diaryApi";
import * as diaryApi from "../../api/diaryApi";
import * as aiVideoApi from "../../api/aiVideoApi";
import AiVideoResultComponent from "./AiVideoResultComponent";

interface AiVideoGenerateProps {
  diary: BabyDiary | null;
}

const AiVideoGenerateComponent = ({ diary }: AiVideoGenerateProps) => {
  const [videoPhoto, setVideoPhoto] = useState<File | null>(null);
  const [videoPhotoPreview, setVideoPhotoPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setVideoPhoto(null);
    setVideoPhotoPreview(null);
    setVideoUrl(null);
    setIsGenerating(false);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [diary?.diaryNo]);

  const applyVideoPhoto = (file: File | null) => {
    setVideoPhoto(file);
    setVideoPhotoPreview(file ? URL.createObjectURL(file) : null);
  };

  const getImageFile = async (): Promise<File | null> => {
    if (videoPhoto) return videoPhoto;

    if (diary?.photoFileName) {
      const res = await fetch(diaryApi.getViewUrl(diary.photoFileName));
      const blob = await res.blob();
      return new File([blob], diary.photoFileName, { type: blob.type });
    }

    return null;
  };

  const pollStatus = (taskId: string) => {
    const intervalId = setInterval(async () => {
      try {
        const result = await aiVideoApi.checkStatus(taskId);

        if (result.status === "succeed") {
          clearInterval(intervalId);
          pollIntervalRef.current = null;
          setVideoUrl(result.videoUrl);
          setIsGenerating(false);
        } else if (result.status === "failed") {
          clearInterval(intervalId);
          pollIntervalRef.current = null;
          alert("영상 생성에 실패했습니다.");
          setIsGenerating(false);
        }
      } catch (err) {
        clearInterval(intervalId);
        pollIntervalRef.current = null;
        alert("상태 확인 중 오류가 발생했습니다.");
        console.error(err);
        setIsGenerating(false);
      }
    }, 5000);

    pollIntervalRef.current = intervalId;
  };

  const handleGenerate = async () => {
    if (!diary) return;

    const imageFile = await getImageFile();
    if (!imageFile) {
      alert("사진이 필요합니다.");
      return;
    }

    setIsGenerating(true);
    setVideoUrl(null);

    try {
      const { taskId } = await aiVideoApi.generate(diary.content, imageFile);
      pollStatus(taskId);
    } catch (err) {
      alert("영상 생성 요청에 실패했습니다.");
      console.error(err);
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-[20px] border border-[rgba(42,41,38,0.1)] bg-[#FAF6F0] p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-[#2A2926]">AI 영상 만들기</p>
        <button
          type="button"
          onClick={videoUrl ? () => setVideoUrl(null) : handleGenerate}
          disabled={
            isGenerating || (!videoUrl && (!diary || (!diary.photoFileName && !videoPhoto)))
          }
          className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
            videoUrl
              ? "border border-[rgba(42,41,38,0.15)] text-[#7A756C] hover:bg-[rgba(42,41,38,0.06)]"
              : "bg-[#7F77DD] text-white"
          }`}
        >
          {isGenerating && (
            <span className="h-3 w-3 flex-shrink-0 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {isGenerating ? "생성 중..." : videoUrl ? "영상 삭제하기" : "영상 만들기"}
        </button>
      </div>

      {!!diary && !diary.photoFileName && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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

      <AiVideoResultComponent diary={diary} videoUrl={videoUrl} />
    </div>
  );
};

export default AiVideoGenerateComponent;
