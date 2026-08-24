import jwtAxios from "../util/jwtUtil";

const STORY_HOST = "http://localhost:8080/api/stories";

export type StoryTheme = "BEDTIME" | "ADVENTURE" | "FRIENDSHIP" | "HABIT" | "FAMILY";

export interface StoryGenerateRequest {
  babyName: string;
  ageMonths: number;
  interests: string[];
  favoriteItems: string[];
  theme: StoryTheme;
}

export interface StoryGenerateResponse {
  storyId: string;
  title: string;
  content: string;
  generationMode: "LLM";
  characterCount: number;
  sceneCount: number;
}

export const generateStory = async (request: StoryGenerateRequest): Promise<StoryGenerateResponse> => {
  const response = await jwtAxios.post(`${STORY_HOST}/generate`, request);
  return response.data;
};

export const synthesizeStory = async (text: string): Promise<Blob> => {
  const response = await jwtAxios.post(`${STORY_HOST}/tts`, { text }, { responseType: "blob" });
  return response.data;
};
