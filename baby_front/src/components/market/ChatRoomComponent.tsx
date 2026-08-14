import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import * as chatApi from "../../api/chatApi";
import type { ChatMessage } from "../../api/chatApi";
import * as marketApi from "../../api/marketApi";
import useCustomLogin from "../../hooks/useCustomLogin";
import { getAccessToken } from "../../util/accessTokenStore";

const API_SERVER_HOST = "http://localhost:8080";

const ChatRoomComponent = () => {
  const { roomNo } = useParams();
  const { loginState } = useCustomLogin();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);

  const clientRef = useRef<Client | null>(null);

  const loadMessages = async () => {
    if (!roomNo) {
      return;
    }
    setMessages(await chatApi.getMessages(Number(roomNo)));
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
        client.subscribe(`/topic/chat/${roomNo}`, (message: IMessage) => {
          const received: ChatMessage = JSON.parse(message.body);
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

  if (!roomNo) {
    return <div className="card">잘못된 접근입니다.</div>;
  }

  const sendMessage = (payload: Partial<ChatMessage>) => {
    if (!clientRef.current || !connected) return;

    clientRef.current.publish({
      destination: `/app/chat/${roomNo}/send`,
      body: JSON.stringify({ roomNo: Number(roomNo), ...payload }),
    });
  };

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage({ msgType: "TEXT", content: input.trim() });
    setInput("");
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const fileName = await chatApi.uploadChatImage(file);
    sendMessage({ msgType: "IMAGE", content: fileName });
  };

  const handleOfferResponse = async (
    msgNo: number,
    status: "ACCEPTED" | "DECLINED",
  ) => {
    await chatApi.respondToOffer(msgNo, status);
    loadMessages();
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

              {msg.msgType === "TEXT" && (
                <div className={`chat-bubble${mine ? " mine" : ""}`}>
                  {msg.content}
                </div>
              )}

              {msg.msgType === "IMAGE" && msg.content && (
                <div className={`chat-bubble${mine ? " mine" : ""}`}>
                  <img src={marketApi.getFileUrl(msg.content)} />
                </div>
              )}

              {msg.msgType === "OFFER" && (
                <div className={`chat-bubble${mine ? " mine" : ""}`}>
                  제안 가격: {msg.offerPrice?.toLocaleString()}원 (
                  {msg.offerStatus})
                  {msg.offerStatus === "PENDING" && !mine && (
                    <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                      <button
                        className="btn ghost"
                        onClick={() =>
                          handleOfferResponse(msg.msgNo!, "ACCEPTED")
                        }
                      >
                        수락
                      </button>
                      <button
                        className="btn ghost"
                        onClick={() =>
                          handleOfferResponse(msg.msgNo!, "DECLINED")
                        }
                      >
                        거절
                      </button>
                    </div>
                  )}
                </div>
              )}
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
      <div style={{ marginTop: 8 }}>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
      </div>
    </div>
  );
};

export default ChatRoomComponent;
