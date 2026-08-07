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
    <div>
      <h2>채팅</h2>

      {rooms.length === 0 && <div>채팅방이 없습니다.</div>}

      <ul>
        {rooms.map((room) => (
          <li
            key={room.roomNo}
            onClick={() => navigate(`/market/chat/${room.roomNo}`)}
          >
            매물 #{room.itemNo} ·{" "}
            {loginState.email === room.buyerEmail
              ? room.sellerEmail
              : room.buyerEmail}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChatRoomListComponent;
