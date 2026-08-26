import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as chatApi from "../../api/chatApi";
import type { ChatRoom } from "../../api/chatApi";
import useCustomLogin from "../../hooks/useCustomLogin";
import "../../styles/market.css";

const PAGE_SIZE = 9;

const ChatRoomListComponent = () => {
  const navigate = useNavigate();
  const { isLogin, loginState } = useCustomLogin();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!isLogin) {
      return;
    }
    chatApi.getMyRoomList().then(setRooms);
  }, [isLogin]);

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
        {pagedRooms.map((room) => (
          <div
            className="chat-room-card"
            key={room.roomNo}
            onClick={() => navigate(`/market/chat/${room.roomNo}`)}
          >
            <span className="chip" style={{ alignSelf: "flex-start" }}>
              {loginState.email === room.sellerEmail ? "판매" : "구매"}
              {room.itemStatus === "거래완료" ? "완료" : "중"}
            </span>
            <span className="chat-room-card-title">
              {room.itemTitle ?? `매물 #${room.itemNo}`}
            </span>
            <span className="chat-room-card-peer">
              {loginState.email === room.buyerEmail
                ? room.sellerEmail
                : room.buyerEmail}
            </span>
          </div>
        ))}
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

export default ChatRoomListComponent;
