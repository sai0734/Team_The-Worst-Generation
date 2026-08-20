import { FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import * as babysitterChatApi from "../../api/babysitterChatApi";
import type { BabysitterChatMessage, BabysitterChatRoom } from "../../api/babysitterChatApi";
import * as babysitterApi from "../../api/babysitterApi";
import { TIME_SLOT_LABELS, REQUEST_STATUS_LABELS } from "../../api/babysitterApi";
import type { TimeSlot, DayOfWeek, BabysitterProfile, BabysitterRequest } from "../../api/babysitterApi";
import useCustomLogin from "../../hooks/useCustomLogin";
import { getAccessToken } from "../../util/accessTokenStore";
import MiniCalendar from "../common/MiniCalendar";
import "../../styles/market.css";

const API_SERVER_HOST = "http://localhost:8080";
const SLOTS = Object.keys(TIME_SLOT_LABELS) as TimeSlot[];
const JS_DAY_TO_DAYOFWEEK: DayOfWeek[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const dayOfWeekOf = (dateStr: string): DayOfWeek =>
  JS_DAY_TO_DAYOFWEEK[new Date(`${dateStr}T00:00:00`).getDay()];

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

  // 상대방(부모 입장이면 시터, 시터 입장이면 부모)과 나 사이의 요청들 - 카드 상세 표시 + 수정 대상 찾기에 씀
  const [counterpartRequests, setCounterpartRequests] = useState<BabysitterRequest[]>([]);
  const [sitterProfile, setSitterProfile] = useState<BabysitterProfile | null>(null);
  const [bookedDates, setBookedDates] = useState<string[]>([]);

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [editingRequestNo, setEditingRequestNo] = useState<number | null>(null);
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

  const loadCounterpartRequests = () => {
    if (!room) return;
    if (isSitterHere) {
      babysitterApi
        .getReceivedRequests()
        .then((list) => setCounterpartRequests(list.filter((r) => r.parentEmail === room.parentEmail)));
    } else {
      babysitterApi
        .getSentRequests()
        .then((list) => setCounterpartRequests(list.filter((r) => r.sitterEmail === room.sitterEmail)));
    }
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

  // 방/역할이 확정되면 요청 상세(카드 표시/수정용)와, 부모 입장이면 시터의 가능 요일·예약 현황까지 같이 불러온다.
  useEffect(() => {
    if (!room) return;
    loadCounterpartRequests();
    if (!isSitterHere) {
      babysitterApi.getOne(room.sitterEmail).then(setSitterProfile);
      babysitterApi.getBookedDates(room.sitterEmail).then(setBookedDates);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.roomNo, isSitterHere]);

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

  const requestByNo = new Map(counterpartRequests.map((r) => [r.requestNo, r]));
  const myPendingRequest = !isSitterHere
    ? counterpartRequests.find((r) => r.status === "PENDING")
    : undefined;

  // 시터가 가능하다고 등록해둔 요일/시간대 목록이 없으면(아직 설정 안 함) 제한을 걸지 않는다.
  const availableSlotsForDate = (dateStr: string): TimeSlot[] => {
    if (!sitterProfile || sitterProfile.availability.length === 0) {
      return SLOTS;
    }
    if (!dateStr) {
      return [];
    }
    const dow = dayOfWeekOf(dateStr);
    return sitterProfile.availability
      .filter((a) => a.dayOfWeek === dow)
      .map((a) => a.timeSlot);
  };

  const currentSlots = !isSitterHere ? availableSlotsForDate(requestDate) : SLOTS;
  const dateHasNoSlot = !isSitterHere && !!requestDate && currentSlots.length === 0;
  const dateIsBooked = !isSitterHere && !!requestDate && bookedDates.includes(requestDate);
  const canSubmitRequest = !!requestDate && !dateHasNoSlot && !dateIsBooked;

  // 달력에서 회색으로 막을 날짜: 시터가 그 요일엔 아예 가능 시간이 없거나, 이미 예약이 찬 날짜
  const isDateBlocked = (dateStr: string): boolean =>
    availableSlotsForDate(dateStr).length === 0 || bookedDates.includes(dateStr);

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

  const handleDateChange = (value: string) => {
    setRequestDate(value);
    const slots = availableSlotsForDate(value);
    if (slots.length > 0 && !slots.includes(requestTimeSlot)) {
      setRequestTimeSlot(slots[0]);
    }
  };

  const handleToggleRequestForm = () => {
    if (!showRequestForm) {
      if (myPendingRequest) {
        setEditingRequestNo(myPendingRequest.requestNo);
        setRequestDate(myPendingRequest.requestDate);
        setRequestTimeSlot(myPendingRequest.timeSlot);
        setRequestMessage(myPendingRequest.message ?? "");
      } else {
        setEditingRequestNo(null);
        setRequestDate("");
        setRequestTimeSlot(SLOTS[0]);
        setRequestMessage("");
      }
    }
    setShowRequestForm((v) => !v);
  };

  const handleSubmitRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (!requestDate) {
      alert("희망 날짜를 선택해주세요.");
      return;
    }
    if (dateHasNoSlot) {
      alert("이 날짜엔 시터가 가능한 시간이 없어요.");
      return;
    }
    if (dateIsBooked) {
      alert("이미 예약이 찬 날짜예요.");
      return;
    }
    if (!room) {
      return;
    }

    try {
      if (editingRequestNo) {
        await babysitterApi.modifyRequest(editingRequestNo, {
          sitterEmail: room.sitterEmail,
          requestDate,
          timeSlot: requestTimeSlot,
          message: requestMessage || undefined,
        });
      } else {
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
      }

      loadCounterpartRequests();
      setShowRequestForm(false);
      setEditingRequestNo(null);
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
      loadCounterpartRequests();
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
          const detail = msg.requestNo != null ? requestByNo.get(msg.requestNo) : undefined;

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
                  <div>
                    돌봄 요청
                    {msg.requestStatus && (
                      <> ({REQUEST_STATUS_LABELS[msg.requestStatus] ?? msg.requestStatus})</>
                    )}
                  </div>
                  {detail && (
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      {detail.requestDate} ({TIME_SLOT_LABELS[detail.timeSlot]})
                      {detail.message && <div>메시지: {detail.message}</div>}
                    </div>
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
          <button type="button" className="btn ghost" onClick={handleToggleRequestForm}>
            {myPendingRequest ? "요청 수정하기" : "요청 보내기"}
          </button>

          {showRequestForm && (
            <form onSubmit={handleSubmitRequest} className="recall-form" style={{ marginTop: 10 }}>
              <div className="field">
                <label>희망 날짜</label>
                <MiniCalendar
                  value={requestDate}
                  onChange={handleDateChange}
                  isDateDisabled={isDateBlocked}
                />
                {requestDate && (
                  <p className="field-hint">선택한 날짜: {requestDate}</p>
                )}
                {dateHasNoSlot && (
                  <p className="field-hint" style={{ color: "#ef6262" }}>
                    이 날짜엔 시터가 가능한 시간이 없어요.
                  </p>
                )}
                {dateIsBooked && (
                  <p className="field-hint" style={{ color: "#ef6262" }}>
                    이미 예약이 찬 날짜예요.
                  </p>
                )}
              </div>
              <div className="field">
                <label>시간대</label>
                <select
                  value={requestTimeSlot}
                  onChange={(e) => setRequestTimeSlot(e.target.value as TimeSlot)}
                  disabled={!requestDate || currentSlots.length === 0}
                >
                  {(currentSlots.length > 0 ? currentSlots : SLOTS).map((slot) => (
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
              <button type="submit" className="submit-btn" disabled={!canSubmitRequest}>
                {editingRequestNo ? "수정하기" : "요청 보내기"}
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
