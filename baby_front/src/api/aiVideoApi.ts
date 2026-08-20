import jwtAxios from "../util/jwtUtil";

const API_SERVER_HOST = "http://localhost:8080";
const prefix = `${API_SERVER_HOST}/api/ai-video`;

export const generate = async (
  content: string,
  file: File,
): Promise<{ taskId: string }> => {
  const formData = new FormData();
  formData.append("content", content);
  formData.append("file", file);

  const res = await jwtAxios.post(`${prefix}/generate`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
};

export const checkStatus = async (
  taskId: string,
): Promise<{ status: string; videoUrl: string | null }> => {
  const res = await jwtAxios.get(`${prefix}/status/${taskId}`);

  return res.data;
};
