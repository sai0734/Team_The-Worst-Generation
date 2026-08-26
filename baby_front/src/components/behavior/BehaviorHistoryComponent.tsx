import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import * as behaviorApi from "../../api/behaviorApi";
import { BehaviorConsult } from "../../api/behaviorApi";
import BehaviorAnswerComponent from "./BehaviorAnswerComponent";

interface BehaviorHistoryProps {
  reloadTrigger: number;
}

const PAGE_SIZE = 3;

const CATEGORY_ICON: Record<string, string> = {
  편식: "🍎",
  떼쓰기: "😢",
  "손톱 물기": "🤚",
  "형제 다툼": "⚔️",
  낯가림: "🙈",
  거짓말: "💬",
};

const formatRegTime = (regTime: string) => {
  const date = new Date(regTime);
  if (isNaN(date.getTime())) return regTime;
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
};

const BehaviorHistoryComponent = ({ reloadTrigger }: BehaviorHistoryProps) => {
  const currentBaby = useSelector(
    (state: RootState) => state.babySlice.currentBaby,
  );

  const [list, setList] = useState<BehaviorConsult[]>([]);
  const [page, setPage] = useState(1);
  const [pageNumList, setPageNumList] = useState<number[]>([]);
  const [prev, setPrev] = useState(false);
  const [next, setNext] = useState(false);
  const [prevPage, setPrevPage] = useState(0);
  const [nextPage, setNextPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [expandedNo, setExpandedNo] = useState<number | null>(null);
  const [detailMap, setDetailMap] = useState<Record<number, BehaviorConsult>>(
    {},
  );
  const [detailLoading, setDetailLoading] = useState<number | null>(null);

  useEffect(() => {
    if (!currentBaby?.babyNo) return;

    setLoading(true);
    behaviorApi
      .getList({ babyNo: currentBaby.babyNo, page, size: PAGE_SIZE })
      .then((result) => {
        setList(result.dtoList);
        setPageNumList(result.pageNumList);
        setPrev(result.prev);
        setNext(result.next);
        setPrevPage(result.prevPage);
        setNextPage(result.nextPage);
      })
      .catch((err) => {
        alert("지난 상담 목록을 불러오지 못했습니다.");
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [currentBaby?.babyNo, page, reloadTrigger]);

  const handleToggle = async (consultNo: number) => {
    if (expandedNo === consultNo) {
      setExpandedNo(null);
      return;
    }

    setExpandedNo(consultNo);
    if (detailMap[consultNo]) return;

    setDetailLoading(consultNo);
    try {
      const detail = await behaviorApi.getDetail(consultNo);
      setDetailMap((prevMap) => ({ ...prevMap, [consultNo]: detail }));
    } catch (err) {
      alert("상담 내용을 불러오지 못했습니다.");
      console.error(err);
      setExpandedNo(null);
    } finally {
      setDetailLoading(null);
    }
  };

  const handleRemove = async (consultNo: number) => {
    if (!window.confirm("이 상담을 삭제하시겠습니까?")) return;

    try {
      await behaviorApi.remove(consultNo);
      if (expandedNo === consultNo) setExpandedNo(null);
      setDetailMap((prevMap) => {
        const nextMap = { ...prevMap };
        delete nextMap[consultNo];
        return nextMap;
      });
      setList((prevList) => prevList.filter((c) => c.consultNo !== consultNo));
    } catch (err) {
      alert("삭제에 실패했습니다.");
      console.error(err);
    }
  };

  if (!loading && list.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-[rgba(42,41,38,0.15)] bg-white p-8 text-center">
        <span className="text-2xl">🧠</span>
        <p className="text-sm font-bold text-[#2A2926]">
          아직 상담 기록이 없어요
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-bold text-[#7A756C]">지난 상담</p>

      <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
      {list.map((consult) => {
        const isOpen = expandedNo === consult.consultNo;

        return (
          <div
            key={consult.consultNo}
            className={`rounded-[20px] border border-[rgba(42,41,38,0.1)] bg-white ${
              isOpen ? "md:col-span-2 xl:col-span-3" : ""
            }`}
          >
            <div className="flex w-full items-center gap-2 p-4">
              <button
                type="button"
                onClick={() => handleToggle(consult.consultNo)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px] bg-[#EAF6FF] text-lg">
                  {CATEGORY_ICON[consult.category] ?? "🧠"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#7A756C]">
                    {formatRegTime(consult.regTime)} · {consult.category}
                  </p>
                  <p className="truncate text-sm text-[#2A2926]">
                    {consult.situation}
                  </p>
                </div>
                <span
                  className={`flex-shrink-0 text-[#C9C7BD] transition-transform ${isOpen ? "rotate-90" : ""}`}
                >
                  ›
                </span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(consult.consultNo);
                }}
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(42,41,38,0.06)] text-xs font-bold text-[#7A756C] transition-colors hover:bg-[#f3d9d9] hover:text-[#c0392b]"
              >
                ✕
              </button>
            </div>

            {isOpen && (
              <div className="border-t border-[rgba(42,41,38,0.08)] p-4">
                {detailLoading === consult.consultNo && (
                  <p className="text-sm text-[#7A756C]">불러오는 중...</p>
                )}
                {detailMap[consult.consultNo] && (
                  <BehaviorAnswerComponent
                    consult={detailMap[consult.consultNo]}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
      </div>

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

export default BehaviorHistoryComponent;
