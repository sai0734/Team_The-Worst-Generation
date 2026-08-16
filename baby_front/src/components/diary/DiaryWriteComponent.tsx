import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { FormEvent, useState } from "react";
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

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-[24px] border border-[rgba(42,41,38,0.1)] bg-[#FAF6F0] p-4 sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative h-[160px] w-full flex-shrink-0 sm:w-[160px]">
          {preview ? (
            <img
              className="h-full w-full rounded-[16px] object-cover border-4 border-[#CAF4FF]"
              src={preview}
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
              setFile(selected);
              setPreview(selected ? URL.createObjectURL(selected) : null);
            }}
          />
        </div>
        <textarea
          className="h-[160px] flex-1 min-w-0 resize-none rounded-[16px] border border-[rgba(42,41,38,0.12)] bg-white p-4 text-sm text-[#2A2926] outline-none transition-colors focus:border-[#5AB2FF]"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="오늘 하루는 어땠나요?"
        />
      </div>
      <div className="flex items-center justify-end gap-3">
        <span className="text-xs font-bold text-[#7A756C]">날짜 선택하기</span>
        <input
          type="date"
          className="rounded-[12px] border border-[rgba(42,41,38,0.12)] bg-white px-3 py-2 text-sm font-bold text-[#7A756C] outline-none transition-colors focus:border-[#5AB2FF]"
          value={diaryDate}
          onChange={(e) => setDiaryDate(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-full bg-[#5AB2FF] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1E6FCC]"
        >
          저장하기
        </button>
      </div>
    </form>
  );
};

export default DiaryWriteComponent;
