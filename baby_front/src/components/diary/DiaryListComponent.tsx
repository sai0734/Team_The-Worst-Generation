import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import * as diaryApi from "../../api/diaryApi";
import { BabyDiary } from "../../api/diaryApi";
import DiaryDetailModalComponent from "./DiaryDetailModalComponent";

interface DiaryListProps {
  reloadTrigger: number;
}

const PAGE_SIZE = 5;

const inputClass =
  "w-full rounded-[14px] border border-[rgba(42,41,38,0.12)] bg-white p-3 text-sm text-[#2A2926] outline-none transition-colors focus:border-[#5AB2FF]";

const DiaryListComponent = ({ reloadTrigger }: DiaryListProps) => {
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

  const [editingNo, setEditingNo] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [selectedDiary, setSelectedDiary] = useState<BabyDiary | null>(null);

  const [keyword, setKeyword] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  const loadList = async () => {
    if (!currentBaby?.babyNo) return;

    const result = await diaryApi.getList({
      babyNo: currentBaby.babyNo,
      page,
      size: PAGE_SIZE,
      keyword: searchKeyword || undefined,
    });

    setList(result.dtoList);
    setPageNumList(result.pageNumList);
    setPrev(result.prev);
    setNext(result.next);
    setPrevPage(result.prevPage);
    setNextPage(result.nextPage);
  };

  useEffect(() => {
    loadList();
  }, [currentBaby?.babyNo, page, reloadTrigger, searchKeyword]);

  const handleSearch = () => {
    setSearchKeyword(keyword);
    setPage(1);
  };

  const handleOpenEdit = (diary: BabyDiary) => {
    setEditingNo(diary.diaryNo);
    setEditContent(diary.content);
  };

  const handleCancelEdit = () => {
    setEditingNo(null);
  };

  const handleSaveEdit = async (diaryNo: number) => {
    const formData = new FormData();
    formData.append("content", editContent);

    try {
      await diaryApi.modify(diaryNo, formData);
      setEditingNo(null);
      await loadList();
    } catch (err) {
      alert("수정에 실패했습니다.");
      console.error(err);
    }
  };

  const handleRemove = async (diaryNo: number) => {
    if (!window.confirm("이 일기를 삭제하시겠습니까?")) return;

    try {
      await diaryApi.remove(diaryNo);
      await loadList();
    } catch (err) {
      alert("삭제에 실패했습니다.");
      console.error(err);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${weekday})`;
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          className={inputClass}
          placeholder="일기 내용 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
        />
        <button
          type="button"
          className="flex-shrink-0 rounded-full bg-[#5AB2FF] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1E6FCC]"
          onClick={handleSearch}
        >
          검색
        </button>
      </div>
      {list.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-[rgba(42,41,38,0.15)] bg-white p-8 text-center">
          <span className="text-2xl">📔</span>
          <p className="text-sm font-bold text-[#2A2926]">
            아직 작성된 일기가 없어요
          </p>
          <p className="text-xs text-[#7A756C]">
            위에서 오늘 하루를 기록해보세요
          </p>
        </div>
      )}

      {list.map((diary) => (
        <div
          key={diary.diaryNo}
          className={`flex gap-3 rounded-[20px] border border-[rgba(42,41,38,0.1)] bg-white p-4 ${
            editingNo === diary.diaryNo ? "" : "cursor-pointer"
          }`}
          onClick={() => {
            if (editingNo !== diary.diaryNo) setSelectedDiary(diary);
          }}
        >
          {diary.photoFileName ? (
            <img
              className="h-[64px] w-[64px] flex-shrink-0 rounded-[12px] object-cover"
              src={diaryApi.getThumbnailUrl(diary.photoFileName)}
              alt="일기 사진"
            />
          ) : (
            <div className="flex h-[64px] w-[64px] flex-shrink-0 items-center justify-center rounded-[12px] bg-[#EFE9DE] text-xs font-bold text-[#7A756C]">
              사진 없음
            </div>
          )}

          {editingNo === diary.diaryNo ? (
            <div className="flex flex-1 min-w-0 flex-col gap-2">
              <textarea
                className={`${inputClass} h-[80px] resize-none`}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  className="rounded-full bg-[#5AB2FF] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#1E6FCC]"
                  type="button"
                  onClick={() => handleSaveEdit(diary.diaryNo)}
                >
                  저장
                </button>
                <button
                  className="rounded-full border border-[rgba(42,41,38,0.15)] px-4 py-2 text-xs font-bold text-[#7A756C]"
                  type="button"
                  onClick={handleCancelEdit}
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 min-w-0 flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#7A756C]">
                  {formatDate(diary.diaryDate)}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-full bg-[#CAF4FF] px-3 py-1.5 text-xs font-bold text-[#1E6FCC] transition-colors hover:bg-[#A0DEFF]"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEdit(diary);
                    }}
                  >
                    수정
                  </button>
                  <button
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(42,41,38,0.06)] text-xs font-bold text-[#7A756C] transition-colors hover:bg-[#f3d9d9] hover:text-[#c0392b]"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(diary.diaryNo);
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <p className="line-clamp-2 text-sm text-[#2A2926]">
                {diary.content}
              </p>
            </div>
          )}
        </div>
      ))}

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

      {selectedDiary && (
        <DiaryDetailModalComponent
          diary={selectedDiary}
          onClose={() => setSelectedDiary(null)}
        />
      )}
    </div>
  );
};

export default DiaryListComponent;
