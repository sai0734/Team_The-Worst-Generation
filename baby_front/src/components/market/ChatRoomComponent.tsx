import { ChangeEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import * as chatApi from "../../api/chatApi";
import type { ChatMessage } from "../../api/chatApi";
import * as marketApi from "../../api/marketApi";
import useCustomLogin from "../../hooks/useCustomLogin";

// 실시간 전송(WebSocket/STOMP)은 아직 미연결 상태.
// package.json에 @stomp/stompjs, sockjs-client 설치 후 연결 예정.
const ChatRoomComponent = () => {
  const { roomNo } = useParams();
  const { loginState } = useCustomLogin();

  const [messages, setMessages] = useState<ChatMessage[]>([]);

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

  if (!roomNo) {
    return <div className="card">잘못된 접근입니다.</div>;
  }

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const fileName = await chatApi.uploadChatImage(file);
    // TODO: 실시간 전송 연결되면 이 fileName을 IMAGE 메시지로 전송해야 함
    console.log("업로드된 파일명:", fileName);
    alert(
      "이미지는 업로드됐지만, 실시간 전송(STOMP)이 아직 연결 안 돼서 상대에게 보내지진 않아요.",
    );
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
        <button className="btn ghost" onClick={loadMessages}>
          새로고침
        </button>
      </div>

      <div className="chat-window">
        {messages.map((msg) => {
          const mine = msg.senderEmail === loginState.email;
          return (
            <div
              key={msg.msgNo}
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
          placeholder="메시지 입력 (실시간 전송 미연결)"
          disabled
        />
        <button className="btn" disabled>
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
