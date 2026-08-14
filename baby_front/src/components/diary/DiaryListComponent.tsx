import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import * as diaryApi from "../../api/diaryApi";
import { BabyDiary } from "../../api/diaryApi";

interface DiaryListProps {
  reloadTrigger: number;
}

const PAGE_SIZE = 5;

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

  useEffect(() => {
    loadList();
  }, [currentBaby?.babyNo, page, reloadTrigger]);

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
    return `${date.getMonth() + 1}월 ${date.getDate()}일 (${weekday})`;
  };

  return (
    <div>
      {list.map((diary) => (
        <div key={diary.diaryNo}>
          {diary.photoFileName ? (
            <img
              src={diaryApi.getThumbnailUrl(diary.photoFileName)}
              alt="일기 사진"
            />
          ) : (
            <div>사진 없음</div>
          )}

          {editingNo === diary.diaryNo ? (
            <div>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
              <button
                type="button"
                onClick={() => handleSaveEdit(diary.diaryNo)}
              >
                저장
              </button>
              <button type="button" onClick={handleCancelEdit}>
                취소
              </button>
            </div>
          ) : (
            <div>
              <span>{formatDate(diary.diaryDate)}</span>
              <p>{diary.content}</p>
              <button type="button" onClick={() => handleOpenEdit(diary)}>
                수정
              </button>
              <button type="button" onClick={() => handleRemove(diary.diaryNo)}>
                삭제
              </button>
            </div>
          )}
        </div>
      ))}

      <div>
        {prev && (
          <button type="button" onClick={() => setPage(prevPage)}>
            이전
          </button>
        )}
        {pageNumList.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => setPage(num)}
            disabled={num === page}
          >
            {num}
          </button>
        ))}
        {next && (
          <button type="button" onClick={() => setPage(nextPage)}>
            다음
          </button>
        )}
      </div>
    </div>
  );
};

export default DiaryListComponent;
