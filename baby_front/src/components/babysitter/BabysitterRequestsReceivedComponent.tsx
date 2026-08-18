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

const BabysitterRequestsReceivedComponent = () => {
  const navigate = useNavigate();
  const [list, setList] = useState<BabysitterRequest[]>([]);

  const load = () => {
    babysitterApi.getReceivedRequests().then(setList);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAccept = async (requestNo: number) => {
    try {
      await babysitterApi.acceptRequest(requestNo);
      load();
    } catch (err) {
      console.error(err);
      alert(`수락에 실패했습니다.\n(${describeError(err)})`);
    }
  };

  const handleReject = async (requestNo: number) => {
    try {
      await babysitterApi.rejectRequest(requestNo);
      load();
    } catch (err) {
      console.error(err);
      alert(`거절에 실패했습니다.\n(${describeError(err)})`);
    }
  };

  return (
    <div>
      <h2 className="page-title">나에게 온 요청</h2>

      {list.length === 0 && <div className="empty-hint">받은 요청이 없습니다.</div>}

      <div className="sitter-list">
        {list.map((r) => (
          <article key={r.requestNo} className="card sitter-row" style={{ cursor: "default" }}>
            <div className="sitter-row-body">
              <div className="name-row">
                {r.parentNickname ?? "익명"}
                <span className={`badge ${REQUEST_STATUS_BADGE_CLASS[r.status]}`}>
                  {REQUEST_STATUS_LABELS[r.status]}
                </span>
              </div>
              <div className="meta">
                {r.requestDate} ({TIME_SLOT_LABELS[r.timeSlot]})
              </div>
              {r.message && <div className="meta">메시지: {r.message}</div>}

              {r.status === "PENDING" && (
                <div className="sitter-actions">
                  <button type="button" className="btn" onClick={() => handleAccept(r.requestNo)}>
                    수락
                  </button>
                  <button type="button" className="btn ghost" onClick={() => handleReject(r.requestNo)}>
                    거절
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

export default BabysitterRequestsReceivedComponent;
