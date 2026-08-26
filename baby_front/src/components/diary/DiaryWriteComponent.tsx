import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { DragEvent, FormEvent, useState } from "react";
import * as diaryApi from "../../api/diaryApi";

interface DiaryWriteProps {
  onRegistered: () => void;
}

const getTodayStr = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const DiaryWriteComponent = ({ onRegistered }: DiaryWriteProps) => {
  const currentBaby = useSelector(
    (state: RootState) => state.babySlice.currentBaby,
  );

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [diaryDate, setDiaryDate] = useState(getTodayStr());
  const [aiLoading, setAiLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!currentBaby?.babyNo) {
      alert("선택된 아이가 없습니다.");
      return;
    }

    const formData = new FormData();
    formData.append("babyNo", String(currentBaby.babyNo));
    formData.append("content", content);
    formData.append("diaryDate", diaryDate);

    if (file) {
      formData.append("files", file);
    }

    try {
      await diaryApi.register(formData);
      setFile(null);
      setPreview(null);
      setContent("");
      setDiaryDate(getTodayStr());
      onRegistered();
    } catch (err) {
      alert("일기 저장에 실패했습니다.");
      console.error(err);
    }
  };

  const handleGenerateContent = async () => {
    if (!file) return;

    setAiLoading(true);
    try {
      const res = await diaryApi.generateContent(file);
      setContent(res.content);
    } catch (err) {
      alert("AI 일기 생성에 실패했습니다.");
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-[24px] border border-[rgba(42,41,38,0.1)] bg-[#FAF6F0] p-4 sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex w-full flex-shrink-0 flex-col items-center gap-2 sm:w-[200px]">
          <div
            className={`relative h-[200px] w-[200px] rounded-full ${
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
              setFile(dropped);
              setPreview(dropped ? URL.createObjectURL(dropped) : null);
            }}
          >
            {preview ? (
              <img
                className="h-full w-full rounded-full object-cover border-4 border-[#CAF4FF]"
                src={preview}
                alt="미리보기"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-full bg-gradient-to-br from-[#A0DEFF] to-[#5AB2FF] text-white">
                <span className="text-4xl font-bold leading-none">+</span>
                <span className="text-sm font-bold">사진 추가</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 cursor-pointer rounded-full opacity-0"
              onChange={(e) => {
                const selected = e.target.files?.[0] ?? null;
                setFile(selected);
                setPreview(selected ? URL.createObjectURL(selected) : null);
              }}
            />
            {preview && (
              <button
                type="button"
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-[#7A756C] shadow transition-colors hover:bg-[#f3d9d9] hover:text-[#c0392b]"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setPreview(null);
                  setContent("");
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <textarea
          className="h-[200px] flex-1 min-w-0 resize-none rounded-[16px] border border-[rgba(42,41,38,0.12)] bg-white p-4 text-sm text-[#2A2926] outline-none transition-colors focus:border-[#5AB2FF]"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="오늘 하루는 어땠나요?"
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleGenerateContent}
          disabled={!file || aiLoading}
          className="flex h-11 w-[200px] flex-shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#5AB2FF] px-3 text-xs font-bold text-white transition-colors hover:bg-[#1E6FCC] disabled:cursor-not-allowed disabled:bg-[#CBD5E1]"
        >
          {aiLoading && (
            <span className="h-3 w-3 flex-shrink-0 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {aiLoading ? "AI가 작성중..." : "AI로 일기 쓰기 ✨"}
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#7A756C]">날짜 선택하기</span>
          <input
            type="date"
            className="h-11 rounded-[12px] border border-[rgba(42,41,38,0.12)] bg-white px-3 text-sm font-bold text-[#7A756C] outline-none transition-colors focus:border-[#5AB2FF]"
            value={diaryDate}
            onChange={(e) => setDiaryDate(e.target.value)}
          />
          <button
            type="submit"
            className="h-11 rounded-full bg-[#5AB2FF] px-6 text-sm font-bold text-white transition-colors hover:bg-[#1E6FCC]"
          >
            저장하기
          </button>
        </div>
      </div>
    </form>
  );
};

export default DiaryWriteComponent;
