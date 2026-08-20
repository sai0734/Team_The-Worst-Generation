import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as babysitterApi from "../../api/babysitterApi";
import {
  REQUEST_STATUS_BADGE_CLASS,
  REQUEST_STATUS_LABELS,
  TIME_SLOT_LABELS,
} from "../../api/babysitterApi";
import type { BabysitterRequest } from "../../api/babysitterApi";

const describeError = (err: any): string =>
  err?.response?.data?.error ||
  err?.response?.data?.msg ||
  err?.message ||
  "알 수 없는 오류";

const BabysitterRequestsSentComponent = () => {
  const navigate = useNavigate();
  const [list, setList] = useState<BabysitterRequest[]>([]);

  const load = () => {
    babysitterApi.getSentRequests().then(setList);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCancel = async (requestNo: number) => {
    if (!confirm("요청을 취소할까요?")) {
      return;
    }
    try {
      await babysitterApi.cancelRequest(requestNo);
      load();
    } catch (err) {
      console.error(err);
      alert(`취소에 실패했습니다.\n(${describeError(err)})`);
    }
  };

  return (
    <div>
      {list.length === 0 && <div className="empty-hint">보낸 요청이 없습니다.</div>}

      <div className="sitter-list">
        {list.map((r) => (
          <article
            key={r.requestNo}
            className="card sitter-row"
            onClick={() => navigate(`/community/babysitter/${r.sitterEmail}`)}
          >
            <div className="sitter-row-body">
              <div className="name-row">
                {r.sitterName ?? "탈퇴한 시터"}
                <span className={`badge ${REQUEST_STATUS_BADGE_CLASS[r.status]}`}>
                  {REQUEST_STATUS_LABELS[r.status]}
                </span>
              </div>
              <div className="meta">
                {r.requestDate} ({TIME_SLOT_LABELS[r.timeSlot]})
                {r.status === "ACCEPTED" && r.reviewed && " · 후기 작성 완료"}
              </div>

              {r.status === "PENDING" && (
                <div className="sitter-actions">
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancel(r.requestNo);
                    }}
                  >
                    요청 취소
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="sitter-back-link">
        <button type="button" className="btn ghost" onClick={() => navigate("/community/babysitter")}>
          목록으로
        </button>
      </div>
    </div>
  );
};

export default BabysitterRequestsSentComponent;
