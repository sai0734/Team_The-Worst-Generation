import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as babysitterChatApi from "../../api/babysitterChatApi";
import type { BabysitterChatRoom } from "../../api/babysitterChatApi";
import * as babysitterApi from "../../api/babysitterApi";
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_BADGE_CLASS } from "../../api/babysitterApi";
import type { BabysitterRequest } from "../../api/babysitterApi";
import useCustomLogin from "../../hooks/useCustomLogin";
import "../../styles/market.css";

const PAGE_SIZE = 9;

const BabysitterChatRoomListComponent = () => {
  const navigate = useNavigate();
  const { isLogin, loginState } = useCustomLogin();
  const [rooms, setRooms] = useState<BabysitterChatRoom[]>([]);
  const [page, setPage] = useState(1);
  // 부모 입장: 내가 보낸 요청의 최신 상태(대기중/수락/거절)를 상대(시터)별로 보여주기 위함
  const [sentRequests, setSentRequests] = useState<BabysitterRequest[]>([]);
  // 시터 입장: 새로 들어온(아직 대기중인) 요청이 있는 상대(부모)를 "요청옴"으로 보여주기 위함
  const [receivedRequests, setReceivedRequests] = useState<BabysitterRequest[]>([]);

  useEffect(() => {
    if (!isLogin) {
      return;
    }
    babysitterChatApi.getMyRoomList().then(setRooms);
    babysitterApi.getSentRequests().then(setSentRequests);
    babysitterApi.getReceivedRequests().then(setReceivedRequests);
  }, [isLogin]);

  // 같은 시터에게 여러 번 요청했을 수 있으니, 가장 최근(requestNo가 큰) 요청의 상태를 보여줌
  const latestSentStatus = (sitterEmail: string) => {
    const mine = sentRequests.filter((r) => r.sitterEmail === sitterEmail);
    if (mine.length === 0) return null;
    return mine.reduce((a, b) => (a.requestNo > b.requestNo ? a : b)).status;
  };

  const hasPendingRequestFrom = (parentEmail: string) =>
    receivedRequests.some((r) => r.parentEmail === parentEmail && r.status === "PENDING");

  if (!isLogin) {
    return (
      <div className="card">
        <p>로그인이 필요한 페이지입니다.</p>
        <button className="btn" onClick={() => navigate("/member/login")}>
          로그인하러 가기
        </button>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(rooms.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRooms = rooms.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="card market-page-wide">
      <h2 style={{ marginTop: 0 }}>채팅</h2>

      {rooms.length === 0 && <p>채팅방이 없습니다.</p>}

      <div className="chat-room-grid">
        {pagedRooms.map((room) => {
          const isParent = loginState.email === room.parentEmail;
          const sentStatus = isParent ? latestSentStatus(room.sitterEmail) : null;
          const requestIncoming = !isParent && hasPendingRequestFrom(room.parentEmail);

          return (
            <div
              className="chat-room-card"
              key={room.roomNo}
              onClick={() => navigate(`/community/babysitter/chat/${room.roomNo}`)}
            >
              <span className="chat-room-card-title">
                {isParent ? room.sitterEmail : room.parentEmail}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {sentStatus && sentStatus !== "CANCELED" && (
                  <span className={`badge ${REQUEST_STATUS_BADGE_CLASS[sentStatus]}`}>
                    {REQUEST_STATUS_LABELS[sentStatus]}
                  </span>
                )}
                {requestIncoming && <span className="badge pending">요청옴</span>}
                {!!room.unreadCount && (
                  <span className="chat-unread-badge">
                    {room.unreadCount > 99 ? "99+" : room.unreadCount}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="market-pagination">
          <button
            type="button"
            className="entry-action-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            이전
          </button>
          <span className="market-pagination-status">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            className="entry-action-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
};

export default BabysitterChatRoomListComponent;
