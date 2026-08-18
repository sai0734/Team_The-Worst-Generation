import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import * as babysitterChatApi from "../../api/babysitterChatApi";
import type { BabysitterChatMessage } from "../../api/babysitterChatApi";
import useCustomLogin from "../../hooks/useCustomLogin";
import { getAccessToken } from "../../util/accessTokenStore";
import "../../styles/market.css";

const API_SERVER_HOST = "http://localhost:8080";

const BabysitterChatRoomComponent = () => {
  const { roomNo } = useParams();
  const navigate = useNavigate();
  const { isLogin, loginState } = useCustomLogin();

  const [messages, setMessages] = useState<BabysitterChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);

  const clientRef = useRef<Client | null>(null);

  const loadMessages = async () => {
    if (!roomNo) {
      return;
    }
    setMessages(await babysitterChatApi.getMessages(Number(roomNo)));
  };

  useEffect(() => {
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomNo]);

  // 실시간 전송(WebSocket/STOMP) 연결: 방에 입장하면 붙고, 나가면 해제
  useEffect(() => {
    if (!roomNo) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_SERVER_HOST}/ws-chat`),
      connectHeaders: {
        Authorization: `Bearer ${getAccessToken() ?? ""}`,
      },
      reconnectDelay: 3000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/babysitter-chat/${roomNo}`, (message: IMessage) => {
          const received: BabysitterChatMessage = JSON.parse(message.body);
          setMessages((prev) => [...prev, received]);
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
      onWebSocketClose: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      setConnected(false);
    };
  }, [roomNo]);

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

  if (!roomNo) {
    return <div className="card">잘못된 접근입니다.</div>;
  }

  const handleSend = () => {
    if (!input.trim() || !clientRef.current || !connected) return;

    clientRef.current.publish({
      destination: `/app/babysitter-chat/${roomNo}/send`,
      body: JSON.stringify({
        roomNo: Number(roomNo),
        senderEmail: loginState.email,
        content: input.trim(),
      }),
    });
    setInput("");
  };

  return (
    <div className="card" style={{ maxWidth: 480 }}>
      <div className="market-toolbar">
        <h2 style={{ margin: 0 }}>채팅방 #{roomNo}</h2>
        <span style={{ fontSize: 12, color: connected ? "green" : "gray" }}>
          {connected ? "연결됨" : "연결 중..."}
        </span>
      </div>

      <div className="chat-window">
        {messages.map((msg, idx) => {
          const mine = msg.senderEmail === loginState.email;
          return (
            <div
              key={msg.msgNo ?? `pending-${idx}`}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: mine ? "flex-end" : "flex-start",
              }}
            >
              <div className="chat-sender">{mine ? "나" : msg.senderEmail}</div>
              <div className={`chat-bubble${mine ? " mine" : ""}`}>
                {msg.content}
              </div>
            </div>
          );
        })}
      </div>

      <div className="chat-input-row">
        <input
          type="text"
          placeholder="메시지 입력"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          disabled={!connected}
        />
        <button className="btn" onClick={handleSend} disabled={!connected}>
          전송
        </button>
      </div>
    </div>
  );
};

export default BabysitterChatRoomComponent;
