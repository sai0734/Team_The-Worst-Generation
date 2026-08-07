import jwtAxios from "../util/jwtUtil";

export interface ChatbotRequest {
  message: string;
  history?: string[];
}

export interface ChatbotResponse {
  reply: string;
  summary: string;
  ready: boolean;
}

const prefix = "http://localhost:8080/api/chatbot";

export const chatbotApi = {
  chat: async (payload: ChatbotRequest): Promise<ChatbotResponse> => {
    const res = await jwtAxios.post(prefix, payload);
    return res.data;
  },
};
