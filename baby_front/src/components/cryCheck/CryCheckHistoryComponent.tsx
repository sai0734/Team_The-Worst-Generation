import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import * as cryCheckApi from "../../api/cryCheckApi";
import { parseAiResult } from "../../api/cryCheckApi";
import type { CryCheck } from "../../api/cryCheckApi";
import CryCheckResultView from "./CryCheckResultView";

interface CryCheckHistoryProps {
  reloadTrigger?: number;
}

const CryCheckHistoryComponent = ({ reloadTrigger }: CryCheckHistoryProps) => {
  const currentBaby = useSelector(
    (state: RootState) => state.babySlice.currentBaby,
  );
  const [list, setList] = useState<CryCheck[]>([]);
  const [openNo, setOpenNo] = useState<number | null>(null);

  useEffect(() => {
    if (!currentBaby?.babyNo) return;

    cryCheckApi.getList(currentBaby.babyNo).then((data) => {
      setList(
        [...data].sort(
          (a, b) =>
            new Date(b.regTime).getTime() - new Date(a.regTime).getTime(),
        ),
      );
    });
  }, [currentBaby?.babyNo, reloadTrigger]);

  const toggleOpen = (cryCheckNo: number) => {
    setOpenNo((prev) => (prev === cryCheckNo ? null : cryCheckNo));
  };

  const handleFeedbackSubmit = (cryCheckNo: number, feedback: string) => {
    setList((prev) =>
      prev.map((item) =>
        item.cryCheckNo === cryCheckNo ? { ...item, userFeedback: feedback } : item,
      ),
    );
  };

  const handleDelete = async (cryCheckNo: number) => {
    if (!confirm("이 분석 기록을 삭제할까요?")) return;

    try {
      await cryCheckApi.remove(cryCheckNo);
      setList((prev) => prev.filter((item) => item.cryCheckNo !== cryCheckNo));
      if (openNo === cryCheckNo) setOpenNo(null);
    } catch (err) {
      console.error(err);
      alert("삭제에 실패했습니다.");
    }
  };

  return (
    <div className="card">
      <div className="head">
        <h2>분석 기록</h2>
      </div>

      {list.length === 0 ? (
        <p className="cry-check-empty">아직 분석 기록이 없습니다.</p>
      ) : (
        <div className="cry-check-history-list">
          {list.map((item) => {
            const parsed = parseAiResult(item.aiResultJson);
            const topCause =
              parsed.candidates[0]?.cause ?? parsed.notice ?? "결과 없음";
            const isOpen = openNo === item.cryCheckNo;

            return (
              <div
                className="cry-check-history-item"
                key={item.cryCheckNo}
                style={isOpen ? { gridColumn: "1 / -1" } : undefined}
              >
                <div
                  className="row-top"
                  onClick={() => toggleOpen(item.cryCheckNo)}
                >
                  <span className="date">
                    {new Date(item.regTime).toLocaleString("ko-KR")}
                  </span>
                  <span className="row-top-right">
                    <span className="chip">패턴 {item.pattern}</span>
                    <button
                      type="button"
                      className="cry-check-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.cryCheckNo);
                      }}
                      aria-label="삭제"
                    >
                      ×
                    </button>
                  </span>
                </div>
                <div
                  className="top-cause"
                  onClick={() => toggleOpen(item.cryCheckNo)}
                >
                  {topCause}
                </div>

                {isOpen && (
                  <CryCheckResultView
                    item={item}
                    onFeedbackSubmit={(feedback) =>
                      handleFeedbackSubmit(item.cryCheckNo, feedback)
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CryCheckHistoryComponent;
