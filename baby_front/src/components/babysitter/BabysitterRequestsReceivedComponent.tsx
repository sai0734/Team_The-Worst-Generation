import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as babysitterApi from "../../api/babysitterApi";
import * as babysitterChatApi from "../../api/babysitterChatApi";
import {
  REQUEST_STATUS_BADGE_CLASS,
  REQUEST_STATUS_LABELS,
  TIME_SLOT_LABELS,
} from "../../api/babysitterApi";
import type { BabysitterRequest, RequestStatus } from "../../api/babysitterApi";

const STATUS_TABS: { value: RequestStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "PENDING", label: "대기" },
  { value: "ACCEPTED", label: "수락" },
  { value: "REJECTED", label: "거절" },
];

const BabysitterRequestsReceivedComponent = () => {
  const navigate = useNavigate();
  const [list, setList] = useState<BabysitterRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "ALL">("ALL");
  // 부모 이메일 -> 그 부모와의 채팅방 번호. 요청은 이제 채팅 안에서만 생기니
  // 대부분 방이 있지만, 예전 방식으로 생성된 요청은 방이 없을 수 있어 버튼을 숨긴다.
  const [roomByParent, setRoomByParent] = useState<Record<string, number>>({});
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());

  const toggleExpanded = (parentEmail: string) => {
    setExpandedParents((prev) => {
      const next = new Set(prev);
      if (next.has(parentEmail)) {
        next.delete(parentEmail);
      } else {
        next.add(parentEmail);
      }
      return next;
    });
  };

  useEffect(() => {
    babysitterApi.getReceivedRequests().then(setList);
    babysitterChatApi.getMyRoomList().then((rooms) => {
      const map: Record<string, number> = {};
      rooms.forEach((room) => {
        map[room.parentEmail] = room.roomNo;
      });
      setRoomByParent(map);
    });
  }, []);

  const filteredList =
    statusFilter === "ALL" ? list : list.filter((r) => r.status === statusFilter);

  // 같은 부모가 여러 번 요청했을 수 있으니 부모 단위로 묶어서 보여준다
  // (getReceivedRequests가 이미 최신순이라, 그룹 순서/그룹 안 순서 모두 자연히 최신순 유지됨)
  const groupedByParent = filteredList.reduce<Record<string, BabysitterRequest[]>>((acc, r) => {
    (acc[r.parentEmail] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div>
      <button
        type="button"
        className="btn ghost sitter-back-link"
        onClick={() => navigate("/community/babysitter/jobs")}
      >
        ← 목록으로
      </button>

      <h2 className="page-title">요청내역</h2>

      <div className="seg" style={{ marginBottom: 12 }}>
        {STATUS_TABS.map((tab) => (
          <button
            type="button"
            key={tab.value}
            className={statusFilter === tab.value ? "is-active" : ""}
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredList.length === 0 && <div className="empty-hint">요청 내역이 없습니다.</div>}

      <div className="sitter-list">
        {Object.entries(groupedByParent).map(([parentEmail, requests]) => {
          const isExpanded = expandedParents.has(parentEmail);
          const visibleRequests = isExpanded ? requests : requests.slice(0, 1);
          const hiddenCount = requests.length - 1;

          return (
            <article key={parentEmail} className="card sitter-row" style={{ cursor: "default" }}>
              <div className="sitter-row-body">
                <div className="name-row">
                  {requests[0].parentNickname ?? "익명"}
                  {roomByParent[parentEmail] != null && (
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => navigate(`/community/babysitter/chat/${roomByParent[parentEmail]}`)}
                    >
                      채팅으로 이동
                    </button>
                  )}
                </div>

                {visibleRequests.map((r, idx) => (
                  <div
                    key={r.requestNo}
                    className="meta"
                    style={idx > 0 ? { marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--line)" } : { marginTop: 4 }}
                  >
                    <span className={`badge ${REQUEST_STATUS_BADGE_CLASS[r.status]}`}>
                      {REQUEST_STATUS_LABELS[r.status]}
                    </span>{" "}
                    {r.requestDate} ({TIME_SLOT_LABELS[r.timeSlot]})
                    {r.message && <div>메시지: {r.message}</div>}
                  </div>
                ))}

                {hiddenCount > 0 && (
                  <button
                    type="button"
                    className="btn ghost"
                    style={{ marginTop: 8 }}
                    onClick={() => toggleExpanded(parentEmail)}
                  >
                    {isExpanded ? "접기 ▴" : `이전 요청 ${hiddenCount}건 더보기 ▾`}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default BabysitterRequestsReceivedComponent;
