import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import * as diaryApi from "../../api/diaryApi";
import { BabyDiary } from "../../api/diaryApi";

interface AiVideoDiarySelectProps {
  selectedDiaryNo: number | null;
  onSelect: (diary: BabyDiary) => void;
}

const PAGE_SIZE = 5;

const AiVideoDiarySelectComponent = ({
  selectedDiaryNo,
  onSelect,
}: AiVideoDiarySelectProps) => {
  const currentBaby = useSelector(
    (state: RootState) => state.babySlice.currentBaby,
  );

  const [list, setList] = useState<BabyDiary[]>([]);
  const [page, setPage] = useState(1);
  const [pageNumList, setPageNumList] = useState<number[]>([]);
  const [prev, setPrev] = useState(false);
  const [next, setNext] = useState(false);
  const [prevPage, setPrevPage] = useState(0);
  const [nextPage, setNextPage] = useState(0);

  useEffect(() => {
    const loadList = async () => {
      if (!currentBaby?.babyNo) return;

      const result = await diaryApi.getList({
        babyNo: currentBaby.babyNo,
        page,
        size: PAGE_SIZE,
      });

      setList(result.dtoList);
      setPageNumList(result.pageNumList);
      setPrev(result.prev);
      setNext(result.next);
      setPrevPage(result.prevPage);
      setNextPage(result.nextPage);
    };

    loadList();
  }, [currentBaby?.babyNo, page]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-bold text-[#7A756C]">
        영상으로 만들 육아일기를 하나 선택해주세요
      </p>

      {list.map((diary) => {
        const checked = diary.diaryNo === selectedDiaryNo;
        return (
          <div
            key={diary.diaryNo}
            onClick={() => onSelect(diary)}
            className={`flex cursor-pointer items-center gap-3 rounded-[14px] border p-3 transition-colors ${
              checked
                ? "border-[#7F77DD] bg-[#F9F8FE]"
                : "border-[rgba(42,41,38,0.1)] bg-white"
            }`}
          >
            <span
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-[1.5px] ${
                checked ? "border-[#7F77DD]" : "border-[#D8D6CC]"
              }`}
            >
              {checked && (
                <span className="h-2.5 w-2.5 rounded-full bg-[#7F77DD]" />
              )}
            </span>
            {diary.photoFileName ? (
              <img
                className="h-10 w-10 flex-shrink-0 rounded-[8px] object-cover"
                src={diaryApi.getThumbnailUrl(diary.photoFileName)}
                alt="일기 사진"
              />
            ) : (
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[8px] bg-[#EFE9DE] text-[10px] font-bold text-[#7A756C]">
                없음
              </div>
            )}
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-xs font-bold text-[#7A756C]">
                {formatDate(diary.diaryDate)}
              </span>
              <p className="truncate text-sm text-[#2A2926]">
                {diary.content}
              </p>
            </div>
          </div>
        );
      })}

      <div className="flex items-center justify-center gap-1.5">
        {prev && (
          <button
            className="rounded-full border border-[rgba(42,41,38,0.15)] bg-white px-3 py-1.5 text-xs font-bold text-[#2A2926]"
            type="button"
            onClick={() => setPage(prevPage)}
          >
            이전
          </button>
        )}
        {pageNumList.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => setPage(num)}
            disabled={num === page}
            className={`h-7 w-7 rounded-full text-xs font-bold transition-colors ${
              num === page
                ? "bg-[#5AB2FF] text-white"
                : "border border-[rgba(42,41,38,0.15)] bg-white text-[#2A2926]"
            }`}
          >
            {num}
          </button>
        ))}
        {next && (
          <button
            className="rounded-full border border-[rgba(42,41,38,0.15)] bg-white px-3 py-1.5 text-xs font-bold text-[#2A2926]"
            type="button"
            onClick={() => setPage(nextPage)}
          >
            다음
          </button>
        )}
      </div>
    </div>
  );
};

export default AiVideoDiarySelectComponent;
