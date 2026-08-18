import jwtAxios from "../util/jwtUtil";

const API_SERVER_HOST = "http://localhost:8080";
const roomPrefix = `${API_SERVER_HOST}/api/market/chat/rooms`;
const chatPrefix = `${API_SERVER_HOST}/api/market/chat`;

// ChatRoomDTO
export interface ChatRoom {
  roomNo?: number;
  itemNo: number;
  buyerEmail?: string;
  sellerEmail?: string;
  regTime?: string;
}

// ChatMessageDTO
export interface ChatMessage {
  msgNo?: number;
  roomNo: number;
  senderEmail?: string;
  msgType: "TEXT" | "OFFER" | "IMAGE";
  content?: string; // TEXT: 메시지 내용, IMAGE: 업로드된 파일명
  offerPrice?: number;
  offerStatus?: "PENDING" | "ACCEPTED" | "DECLINED";
  regTime?: string;
}

export const getMyRoomList = async (): Promise<ChatRoom[]> => {
  const res = await jwtAxios.get(`${roomPrefix}/`);
  return res.data;
};

// 매물 상세에서 "채팅으로 문의하기" 누르면 호출 (있으면 기존방, 없으면 새로)
export const getOrCreateRoom = async (itemNo: number): Promise<ChatRoom> => {
  const res = await jwtAxios.post(`${roomPrefix}/${itemNo}`);
  return res.data;
};

export const getMessages = async (roomNo: number): Promise<ChatMessage[]> => {
  const res = await jwtAxios.get(`${roomPrefix}/${roomNo}/messages`);
  return res.data;
};

// 이미지 첨부: 먼저 업로드 후 파일명 받고, 해당 파일명을 content로 담아 웹소켓 IMAGE 메시지로 전송
export const uploadChatImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await jwtAxios.post(`${chatPrefix}/upload-image`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.fileName;
};

export const respondToOffer = async (
  msgNo: number,
  offerStatus: "ACCEPTED" | "DECLINED",
): Promise<void> => {
  await jwtAxios.put(`${chatPrefix}/messages/${msgNo}/offer`, null, {
    params: { offerStatus },
  });
};
