import * as diaryApi from "../../api/diaryApi";
import { BabyDiary } from "../../api/diaryApi";

interface DiaryDetailModalProps {
  diary: BabyDiary;
  onClose: () => void;
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${weekday})`;
};

const DiaryDetailModalComponent = ({
  diary,
  onClose,
}: DiaryDetailModalProps) => {
  return (
    <div
      className="fixed inset-0 z-[1055] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-[520px] flex-col overflow-hidden rounded-[24px] bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {diary.photoFileName ? (
          <img
            src={diaryApi.getViewUrl(diary.photoFileName)}
            alt="일기 사진 원본"
            className="max-h-[50vh] w-full object-contain bg-[#EFE9DE]"
          />
        ) : (
          <div className="flex h-[200px] w-full items-center justify-center bg-[#EFE9DE] text-sm font-bold text-[#7A756C]">
            사진 없음
          </div>
        )}
        <div className="flex flex-1 min-h-0 flex-col gap-2 overflow-y-auto p-5">
          <span className="text-xs font-bold text-[#7A756C]">
            {formatDate(diary.diaryDate)}
          </span>
          <div className="rounded-[16px] bg-[#FAF6F0] p-4">
            <p className="text-[11px] font-extrabold tracking-[3px] text-[#5AB2FF]">
              육아일기
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-[#2A2926]">
              {diary.content}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="mx-5 mb-5 rounded-full border border-[rgba(42,41,38,0.15)] px-5 py-2.5 text-sm font-bold text-[#7A756C] transition-colors hover:bg-[#f3d9d9] hover:text-[#c0392b]"
          onClick={onClose}
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default DiaryDetailModalComponent;
