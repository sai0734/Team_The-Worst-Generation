import jwtAxios from "../util/jwtUtil";

const API_SERVER_HOST = "http://localhost:8080";
const roomPrefix = `${API_SERVER_HOST}/api/babysitter/chat/rooms`;
const chatPrefix = `${API_SERVER_HOST}/api/babysitter/chat`;

// BabysitterChatRoomDTO
export interface BabysitterChatRoom {
  roomNo: number;
  parentEmail: string;
  sitterEmail: string;
  regTime: string;
  // getMyRoomList()에서만 채워짐: 이 방에서 내가 아직 안 읽은 상대방 메시지 수
  unreadCount?: number;
}

// BabysitterChatMessageDTO
export interface BabysitterChatMessage {
  msgNo?: number;
  roomNo: number;
  senderEmail?: string;
  msgType: "TEXT" | "REQUEST";
  content?: string; // TEXT: 메시지 내용, REQUEST: 미사용
  requestNo?: number;
  requestStatus?: "PENDING" | "ACCEPTED" | "REJECTED";
  regTime?: string;
}

export const getMyRoomList = async (): Promise<BabysitterChatRoom[]> => {
  const res = await jwtAxios.get(`${roomPrefix}/`);
  return res.data;
};

// 시터 상세에서 "채팅하기" 누르면 호출 (있으면 기존방, 없으면 새로)
export const getOrCreateRoom = async (
  sitterEmail: string,
): Promise<BabysitterChatRoom> => {
  const res = await jwtAxios.post(`${roomPrefix}/${sitterEmail}`);
  return res.data;
};

export const getMessages = async (
  roomNo: number,
): Promise<BabysitterChatMessage[]> => {
  const res = await jwtAxios.get(`${roomPrefix}/${roomNo}/messages`);
  return res.data;
};

// 채팅 안 요청 카드 수락/거절
export const respondToRequestCard = async (
  msgNo: number,
  action: "accept" | "reject",
): Promise<void> => {
  await jwtAxios.put(`${chatPrefix}/messages/${msgNo}/respond`, null, {
    params: { action },
  });
};
