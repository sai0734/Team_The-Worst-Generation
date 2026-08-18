import { FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import * as babysitterChatApi from "../../api/babysitterChatApi";
import type { BabysitterChatMessage, BabysitterChatRoom } from "../../api/babysitterChatApi";
import * as babysitterApi from "../../api/babysitterApi";
import { TIME_SLOT_LABELS, REQUEST_STATUS_LABELS } from "../../api/babysitterApi";
import type { TimeSlot } from "../../api/babysitterApi";
import useCustomLogin from "../../hooks/useCustomLogin";
import { getAccessToken } from "../../util/accessTokenStore";
import "../../styles/market.css";

const API_SERVER_HOST = "http://localhost:8080";
const SLOTS = Object.keys(TIME_SLOT_LABELS) as TimeSlot[];

const describeError = (err: any): string =>
  err?.response?.data?.error ||
  err?.response?.data?.msg ||
  err?.message ||
  "알 수 없는 오류";

const BabysitterChatRoomComponent = () => {
  const { roomNo } = useParams();
  const navigate = useNavigate();
  const { isLogin, loginState } = useCustomLogin();

  const [messages, setMessages] = useState<BabysitterChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState<BabysitterChatRoom | null>(null);

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestDate, setRequestDate] = useState("");
  const [requestTimeSlot, setRequestTimeSlot] = useState<TimeSlot>("MORNING");
  const [requestMessage, setRequestMessage] = useState("");

  const clientRef = useRef<Client | null>(null);

  const isSitterHere = room?.sitterEmail === loginState.email;

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

  useEffect(() => {
    if (!roomNo) return;
    babysitterChatApi.getMyRoomList().then((list) => {
      setRoom(list.find((r) => r.roomNo === Number(roomNo)) ?? null);
    });
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
        msgType: "TEXT",
        content: input.trim(),
      }),
    });
    setInput("");
  };

  const handleSendRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (!requestDate || !room) {
      alert("희망 날짜를 선택해주세요.");
      return;
    }

    try {
      const { requestNo } = await babysitterApi.registerRequest({
        sitterEmail: room.sitterEmail,
        requestDate,
        timeSlot: requestTimeSlot,
        message: requestMessage || undefined,
      });

      clientRef.current?.publish({
        destination: `/app/babysitter-chat/${roomNo}/send`,
        body: JSON.stringify({
          roomNo: Number(roomNo),
          senderEmail: loginState.email,
          msgType: "REQUEST",
          requestNo,
          requestStatus: "PENDING",
        }),
      });

      setShowRequestForm(false);
      setRequestDate("");
      setRequestMessage("");
    } catch (err) {
      console.error(err);
      alert(`요청에 실패했습니다.\n(${describeError(err)})`);
    }
  };

  const handleRespond = async (msgNo: number, action: "accept" | "reject") => {
    try {
      await babysitterChatApi.respondToRequestCard(msgNo, action);
      loadMessages();
    } catch (err) {
      console.error(err);
      alert(`처리에 실패했습니다.\n(${describeError(err)})`);
    }
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

              {msg.msgType === "REQUEST" && (
                <div className={`chat-bubble${mine ? " mine" : ""}`}>
                  돌봄 요청
                  {msg.requestStatus && (
                    <> ({REQUEST_STATUS_LABELS[msg.requestStatus] ?? msg.requestStatus})</>
                  )}
                  {isSitterHere && !mine && msg.requestStatus === "PENDING" && (
                    <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => handleRespond(msg.msgNo!, "accept")}
                      >
                        수락
                      </button>
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => handleRespond(msg.msgNo!, "reject")}
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

      {room && !isSitterHere && (
        <div style={{ marginBottom: 10 }}>
          <button
            type="button"
            className="btn ghost"
            onClick={() => setShowRequestForm((v) => !v)}
          >
            요청 보내기
          </button>

          {showRequestForm && (
            <form onSubmit={handleSendRequest} className="recall-form" style={{ marginTop: 10 }}>
              <div className="field">
                <label>희망 날짜</label>
                <input
                  type="date"
                  value={requestDate}
                  onChange={(e) => setRequestDate(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>시간대</label>
                <select
                  value={requestTimeSlot}
                  onChange={(e) => setRequestTimeSlot(e.target.value as TimeSlot)}
                >
                  {SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {TIME_SLOT_LABELS[slot]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>시터에게 남길 메시지 (선택)</label>
                <textarea
                  className="bulk-input"
                  style={{ minHeight: 60 }}
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                />
              </div>
              <button type="submit" className="submit-btn">
                요청 보내기
              </button>
            </form>
          )}
        </div>
      )}

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
