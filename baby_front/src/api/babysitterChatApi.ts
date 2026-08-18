import jwtAxios from "../util/jwtUtil";

const API_SERVER_HOST = "http://localhost:8080";
const roomPrefix = `${API_SERVER_HOST}/api/babysitter/chat/rooms`;

// BabysitterChatRoomDTO
export interface BabysitterChatRoom {
  roomNo: number;
  parentEmail: string;
  sitterEmail: string;
  regTime: string;
}

// BabysitterChatMessageDTO
export interface BabysitterChatMessage {
  msgNo?: number;
  roomNo: number;
  senderEmail?: string;
  content: string;
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
