import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import * as cryCheckApi from "../../api/cryCheckApi";
import { parseAiResult } from "../../api/cryCheckApi";
import type { CryCheck } from "../../api/cryCheckApi";

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
                onClick={() => toggleOpen(item.cryCheckNo)}
              >
                <div className="row-top">
                  <span className="date">
                    {new Date(item.regTime).toLocaleString("ko-KR")}
                  </span>
                  <span className="chip">패턴 {item.pattern}</span>
                </div>
                <div className="top-cause">{topCause}</div>

                {isOpen &&
                  (parsed.candidates.length > 0 ? (
                    parsed.candidates.map((c) => (
                      <div className="cry-check-candidate" key={c.rank}>
                        <span className="rank">{c.rank}</span>
                        <div>
                          <div className="cause">{c.cause}</div>
                          <div className="reason">{c.reason}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="cry-check-notice">
                      {parsed.notice ?? "분석 결과가 없습니다."}
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CryCheckHistoryComponent;
