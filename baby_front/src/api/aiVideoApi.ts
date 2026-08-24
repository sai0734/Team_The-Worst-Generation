import jwtAxios from "../util/jwtUtil";

const API_SERVER_HOST = "http://localhost:8080";
const prefix = `${API_SERVER_HOST}/api/ai-video`;

export const generateFallback = async (
  content: string,
  file: File,
): Promise<{ fileName: string; durationSeconds: number }> => {
  const formData = new FormData();
  formData.append("content", content);
  formData.append("file", file);

  const res = await jwtAxios.post(`${prefix}/generate-fallback`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
};

export const getViewUrl = (fileName: string): string =>
  `${prefix}/view/${fileName}`;
