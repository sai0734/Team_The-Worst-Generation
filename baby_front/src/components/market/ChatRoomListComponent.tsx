import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as chatApi from "../../api/chatApi";
import type { ChatRoom } from "../../api/chatApi";
import useCustomLogin from "../../hooks/useCustomLogin";

const ChatRoomListComponent = () => {
  const navigate = useNavigate();
  const { loginState } = useCustomLogin();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);

  useEffect(() => {
    chatApi.getMyRoomList().then(setRooms);
  }, []);

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>채팅</h2>

      {rooms.length === 0 && <p>채팅방이 없습니다.</p>}

      {rooms.map((room) => (
        <div
          className="list-row"
          key={room.roomNo}
          style={{ cursor: "pointer" }}
          onClick={() => navigate(`/market/chat/${room.roomNo}`)}
        >
          <span>매물 #{room.itemNo}</span>
          <span>
            {loginState.email === room.buyerEmail
              ? room.sellerEmail
              : room.buyerEmail}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ChatRoomListComponent;
