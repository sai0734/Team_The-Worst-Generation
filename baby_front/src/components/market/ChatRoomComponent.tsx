import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import * as chatApi from "../../api/chatApi";
import type { ChatMessage, ChatRoom } from "../../api/chatApi";
import * as marketApi from "../../api/marketApi";
import * as reviewApi from "../../api/reviewApi";
import useCustomLogin from "../../hooks/useCustomLogin";
import { getAccessToken } from "../../util/accessTokenStore";
import "../../styles/market.css";

const API_SERVER_HOST = "http://localhost:8080";

const formatMessageTime = (regTime?: string) => {
  if (!regTime) return "";
  const d = new Date(regTime);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${min}`;
};

const ChatRoomComponent = () => {
  const { roomNo } = useParams();
  const { loginState } = useCustomLogin();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [requestingComplete, setRequestingComplete] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [tempDelta, setTempDelta] = useState(0);
  const [reviewContent, setReviewContent] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

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

  // 채팅방 정보(상대방 이메일/매물 상태/평가 여부) - 단건 조회 API가 따로 없어서 내 채팅방 목록에서 찾음
  const loadRoom = async () => {
    if (!roomNo) return;
    const rooms = await chatApi.getMyRoomList();
    setRoom(rooms.find((r) => r.roomNo === Number(roomNo)) ?? null);
  };

  useEffect(() => {
    loadRoom();
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

  const isBuyer = !!room && loginState.email === room.buyerEmail;
  const isDealClosed = room?.itemStatus === "거래완료";
  const counterpartEmail = room
    ? loginState.email === room.buyerEmail
      ? room.sellerEmail
      : room.buyerEmail
    : null;

  const sendMessage = (payload: Partial<ChatMessage>) => {
    if (!clientRef.current || !connected) return;

    clientRef.current.publish({
      destination: `/app/chat/${roomNo}/send`,
      body: JSON.stringify({
        roomNo: Number(roomNo),
        senderEmail: loginState.email,
        ...payload,
      }),
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

  const handleRequestComplete = async () => {
    if (
      !confirm("거래완료를 신청할까요? 판매자가 확인하면 최종 완료 처리돼요.")
    )
      return;

    setRequestingComplete(true);
    try {
      await chatApi.requestCompleteRoom(Number(roomNo));
      await loadRoom();
    } catch (err) {
      console.error(err);
      alert("거래완료 신청에 실패했습니다.");
    } finally {
      setRequestingComplete(false);
    }
  };

  const handleComplete = async () => {
    if (!confirm("이 거래를 완료 확정할까요? 이후에는 되돌릴 수 없어요."))
      return;

    setCompleting(true);
    try {
      await chatApi.completeRoom(Number(roomNo));
      await loadRoom();
    } catch (err) {
      console.error(err);
      alert("거래완료 확정에 실패했습니다.");
    } finally {
      setCompleting(false);
    }
  };

  const handleSubmitReview = async () => {
    setSubmittingReview(true);
    try {
      await reviewApi.registerReview({
        roomNo: Number(roomNo),
        tempDelta,
        content: reviewContent.trim() || undefined,
      });
      await loadRoom();
    } catch (err) {
      console.error(err);
      alert("온도 평가 등록에 실패했습니다.");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="card market-page-chat">
      <div className="market-toolbar">
        <h2 style={{ margin: 0 }}>
          {counterpartEmail ? `${counterpartEmail}님과의 채팅방` : "채팅방"}
        </h2>
        <span style={{ fontSize: 12, color: connected ? "green" : "gray" }}>
          {connected ? "연결됨" : "연결 중..."}
        </span>
      </div>

      {room && (
        <div className="chat-deal-status">
          {room.itemStatus === "거래완료" ? (
            isBuyer && !room.reviewed ? (
              <div className="chat-temp-review">
                <p className="cry-check-hint" style={{ margin: "0 0 8px" }}>
                  거래가 완료됐어요. 상대방의 매너온도를 조정해줄 수 있어요.
                </p>
                <div className="chat-temp-slider-row">
                  <input
                    type="range"
                    min={-1}
                    max={1}
                    step={0.1}
                    value={tempDelta}
                    onChange={(e) => setTempDelta(Number(e.target.value))}
                  />
                  <span className="chat-temp-value">
                    {tempDelta > 0 ? "+" : ""}
                    {tempDelta.toFixed(1)}°C
                  </span>
                </div>
                <textarea
                  placeholder="한 줄 후기 (선택)"
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  rows={2}
                  style={{ width: "100%", marginTop: 8 }}
                />
                <button
                  type="button"
                  className="btn"
                  style={{ marginTop: 8 }}
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                >
                  {submittingReview ? "등록 중..." : "온도 평가 등록"}
                </button>
              </div>
            ) : (
              <span className="chip">
                거래완료{room.reviewed ? " · 온도 평가 완료" : ""}
              </span>
            )
          ) : isBuyer ? (
            room.completeRequestedAt ? (
              <p className="cry-check-hint" style={{ margin: 0 }}>
                거래완료를 신청했어요. 판매자 확인을 기다리고 있어요.
              </p>
            ) : (
              <button
                type="button"
                className="btn ghost"
                onClick={handleRequestComplete}
                disabled={requestingComplete}
              >
                {requestingComplete ? "신청 중..." : "거래완료 신청"}
              </button>
            )
          ) : room.completeRequestedAt ? (
            <div>
              <p className="cry-check-hint" style={{ margin: "0 0 8px" }}>
                구매자가 거래완료를 신청했어요. 확인 후 확정해주세요.
              </p>
              <button
                type="button"
                className="btn ghost"
                onClick={handleComplete}
                disabled={completing}
              >
                {completing ? "처리 중..." : "거래완료 확정"}
              </button>
            </div>
          ) : (
            <p className="cry-check-hint" style={{ margin: 0 }}>
              구매자가 거래완료 신청을 하면 여기서 확정할 수 있어요.
            </p>
          )}
        </div>
      )}

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

              {msg.regTime && (
                <div className="chat-time">
                  {formatMessageTime(msg.regTime)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isDealClosed ? (
        <p className="cry-check-hint" style={{ marginTop: 10 }}>
          거래가 완료되어 더 이상 메시지를 보낼 수 없어요.
        </p>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};

export default ChatRoomComponent;
