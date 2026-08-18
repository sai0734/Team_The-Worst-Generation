import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as babysitterChatApi from "../../api/babysitterChatApi";
import type { BabysitterChatRoom } from "../../api/babysitterChatApi";
import useCustomLogin from "../../hooks/useCustomLogin";

const BabysitterChatRoomListComponent = () => {
  const navigate = useNavigate();
  const { isLogin, loginState } = useCustomLogin();
  const [rooms, setRooms] = useState<BabysitterChatRoom[]>([]);

  useEffect(() => {
    if (!isLogin) {
      return;
    }
    babysitterChatApi.getMyRoomList().then(setRooms);
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

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>채팅</h2>

      {rooms.length === 0 && <p>채팅방이 없습니다.</p>}

      {rooms.map((room) => (
        <div
          className="list-row"
          key={room.roomNo}
          style={{ cursor: "pointer" }}
          onClick={() => navigate(`/community/babysitter/chat/${room.roomNo}`)}
        >
          <span>
            {loginState.email === room.parentEmail
              ? room.sitterEmail
              : room.parentEmail}
          </span>
        </div>
      ))}
    </div>
  );
};

export default BabysitterChatRoomListComponent;
