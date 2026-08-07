import jwtAxios from "../util/jwtUtil";
import type { PageRequestParam, PageResponse } from "../types/page";

export interface CommunityImage {
  fileName: string;
  video: boolean;
}

export interface CommunityPost {
  postNo: number;
  writerEmail: string;
  nickname: string;
  title: string;
  content: string;
  aiSummary: string | null;
  viewCount: number;
  commentCount: number;
  imageList: CommunityImage[];
  regTime: string;
  modTime: string;
}

export interface CommunityPostInput {
  title: string;
  content: string;
}

export interface CommunityPostSearchParam extends PageRequestParam {
  keyword?: string;
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

const API_SERVER_HOST = "http://localhost:8080";
const prefix = `${API_SERVER_HOST}/api/community/posts`;

const toImageFormData = (files: File[]): FormData => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  return formData;
};

export const communityApi = {
  register: async (post: CommunityPostInput): Promise<{ postNo: number }> => {
    const res = await jwtAxios.post(`${prefix}/`, post);
    return res.data;
  },

  addImages: async (
    postNo: number,
    files: File[],
  ): Promise<{ fileNames: string[] }> => {
    const res = await jwtAxios.post(
      `${prefix}/${postNo}/images`,
      toImageFormData(files),
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data;
  },

  getOne: async (postNo: number): Promise<CommunityPost> => {
    const res = await jwtAxios.get(`${prefix}/${postNo}`);
    return res.data;
  },

  getSummary: async (postNo: number): Promise<{ summary: string }> => {
    const res = await jwtAxios.get(`${prefix}/${postNo}/summary`);
    return res.data;
  },

  getList: async (
    searchParam: CommunityPostSearchParam,
  ): Promise<PageResponse<CommunityPost>> => {
    const res = await jwtAxios.get(`${prefix}/list`, { params: searchParam });
    return res.data;
  },

  modify: async (
    postNo: number,
    post: CommunityPostInput,
  ): Promise<{ RESULT: string }> => {
    const res = await jwtAxios.put(`${prefix}/${postNo}`, post);
    return res.data;
  },

  remove: async (postNo: number): Promise<{ RESULT: string }> => {
    const res = await jwtAxios.delete(`${prefix}/${postNo}`);
    return res.data;
  },

  registerComment: async (
    postNo: number,
    comment: CommunityCommentInput,
  ): Promise<{ commentNo: number }> => {
    const res = await jwtAxios.post(`${prefix}/${postNo}/comments/`, comment);
    return res.data;
  },

  addCommentImages: async (
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
  },

  getComments: async (postNo: number): Promise<CommunityComment[]> => {
    const res = await jwtAxios.get(`${prefix}/${postNo}/comments/`);
    return res.data;
  },

  modifyComment: async (
    postNo: number,
    commentNo: number,
    content: string,
  ): Promise<{ RESULT: string }> => {
    const res = await jwtAxios.put(`${prefix}/${postNo}/comments/${commentNo}`, {
      content,
    });
    return res.data;
  },

  removeComment: async (
    postNo: number,
    commentNo: number,
  ): Promise<{ RESULT: string }> => {
    const res = await jwtAxios.delete(`${prefix}/${postNo}/comments/${commentNo}`);
    return res.data;
  },
};
