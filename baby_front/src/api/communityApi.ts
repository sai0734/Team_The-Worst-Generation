import jwtAxios from "../util/jwtUtil";
import type { PageRequestParam, PageResponse } from "../types/page";

const API_SERVER_HOST = "http://localhost:8080";
const prefix = `${API_SERVER_HOST}/api/community/posts`;

export const getFileUrl = (fileName: string): string =>
  `${prefix}/files/${fileName}`;

export interface CommunityImage {
  fileName: string;
  video: boolean;
}

export const COMMUNITY_CATEGORIES = ["자유", "질문", "후기"] as const;
export type CommunityCategory = (typeof COMMUNITY_CATEGORIES)[number];

export const CATEGORY_BADGE_CLASS: Record<CommunityCategory, string> = {
  자유: "free",
  질문: "question",
  후기: "review",
};

export interface CommunityPost {
  postNo: number;
  writerEmail: string;
  nickname: string;
  category: CommunityCategory;
  title: string;
  content: string;
  aiSummary: string | null;
  viewCount: number;
  commentCount: number;
  likeCount: number;
  liked: boolean;
  imageList: CommunityImage[];
  regTime: string;
  modTime: string;
}

export interface CommunityPostInput {
  category: CommunityCategory;
  title: string;
  content: string;
}

export interface CommunityPostSearchParam extends PageRequestParam {
  keyword?: string;
  category?: CommunityCategory;
}

export interface CommunityComment {
  commentNo: number;
  postNo: number;
  writerEmail: string;
  nickname: string;
  parentCommentNo: number | null;
  content: string | null;
  deleted: boolean;
  imageList: CommunityImage[];
  regTime: string;
  modTime: string;
}

export interface CommunityCommentInput {
  content: string;
  parentCommentNo?: number;
}

const toImageFormData = (files: File[]): FormData => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  return formData;
};

export const register = async (
  post: CommunityPostInput,
): Promise<{ postNo: number }> => {
  const res = await jwtAxios.post(`${prefix}/`, post);

  return res.data;
};

export const addImages = async (
  postNo: number,
  files: File[],
): Promise<{ fileNames: string[] }> => {
  const res = await jwtAxios.post(
    `${prefix}/${postNo}/images`,
    toImageFormData(files),
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  return res.data;
};

export const removeImage = async (
  postNo: number,
  fileName: string,
): Promise<{ RESULT: string }> => {
  const res = await jwtAxios.delete(
    `${prefix}/${postNo}/images/${encodeURIComponent(fileName)}`,
  );

  return res.data;
};

export const getOne = async (postNo: number): Promise<CommunityPost> => {
  const res = await jwtAxios.get(`${prefix}/${postNo}`);

  return res.data;
};

export const getSummary = async (
  postNo: number,
): Promise<{ summary: string }> => {
  const res = await jwtAxios.get(`${prefix}/${postNo}/summary`);

  return res.data;
};

export const getList = async (
  searchParam: CommunityPostSearchParam,
): Promise<PageResponse<CommunityPost>> => {
  const res = await jwtAxios.get(`${prefix}/list`, { params: searchParam });

  return res.data;
};

export const modify = async (
  postNo: number,
  post: CommunityPostInput,
): Promise<{ RESULT: string }> => {
  const res = await jwtAxios.put(`${prefix}/${postNo}`, post);

  return res.data;
};

export const remove = async (postNo: number): Promise<{ RESULT: string }> => {
  const res = await jwtAxios.delete(`${prefix}/${postNo}`);

  return res.data;
};

export const toggleLike = async (
  postNo: number,
): Promise<{ liked: boolean }> => {
  const res = await jwtAxios.put(`${prefix}/${postNo}/like`);

  return res.data;
};

export const registerComment = async (
  postNo: number,
  comment: CommunityCommentInput,
): Promise<{ commentNo: number }> => {
  const res = await jwtAxios.post(`${prefix}/${postNo}/comments/`, comment);

  return res.data;
};

export const addCommentImages = async (
  postNo: number,
  commentNo: number,
  files: File[],
): Promise<{ fileNames: string[] }> => {
  const res = await jwtAxios.post(
    `${prefix}/${postNo}/comments/${commentNo}/images`,
    toImageFormData(files),
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  return res.data;
};

export const getComments = async (
  postNo: number,
): Promise<CommunityComment[]> => {
  const res = await jwtAxios.get(`${prefix}/${postNo}/comments/`);

  return res.data;
};

export const modifyComment = async (
  postNo: number,
  commentNo: number,
  content: string,
): Promise<{ RESULT: string }> => {
  const res = await jwtAxios.put(`${prefix}/${postNo}/comments/${commentNo}`, {
    content,
  });

  return res.data;
};

export const removeComment = async (
  postNo: number,
  commentNo: number,
): Promise<{ RESULT: string }> => {
  const res = await jwtAxios.delete(`${prefix}/${postNo}/comments/${commentNo}`);

  return res.data;
};
