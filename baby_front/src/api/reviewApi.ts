import jwtAxios from "../util/jwtUtil";
import axios from "axios";

const API_SERVER_HOST = "http://localhost:8080";
const prefix = `${API_SERVER_HOST}/api/market/reviews`;

// ReviewDTO
export interface Review {
  reviewNo?: number;
  roomNo?: number;
  itemNo?: number;
  writerEmail?: string;
  targetEmail?: string;
  rating?: number;
  content?: string;
  tempDelta?: number;
  regTime?: string;
}

export const getReviewList = async (targetEmail: string): Promise<Review[]> => {
  const res = await axios.get(`${prefix}/${targetEmail}`);
  return res.data;
};

export const registerReview = async (review: Review): Promise<number> => {
  const res = await jwtAxios.post(`${prefix}/`, review);
  return res.data.result;
};
