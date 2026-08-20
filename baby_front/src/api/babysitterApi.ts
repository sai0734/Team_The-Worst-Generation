import jwtAxios from "../util/jwtUtil";
import type { PageRequestParam, PageResponse } from "../types/page";

const API_SERVER_HOST = "http://localhost:8080";
const prefix = `${API_SERVER_HOST}/api/babysitter/profiles`;
const locationPrefix = `${API_SERVER_HOST}/api/babysitter/location`;
const pickPrefix = `${API_SERVER_HOST}/api/babysitter/picks`;
const requestPrefix = `${API_SERVER_HOST}/api/babysitter/requests`;
const reviewPrefix = `${API_SERVER_HOST}/api/babysitter/reviews`;
const jobPrefix = `${API_SERVER_HOST}/api/babysitter/jobs`;

export const getFileUrl = (fileName: string): string =>
  `${prefix}/files/${fileName}`;

export const MAX_GRADE_LEVEL = 10;

// 부모가 실제로 선정(요청 수락)한 횟수 기준 Lv.1~Lv.10 - 찜(관심)이 아니라 활동 이력을 반영
export const gradeLevelLabel = (level: number): string => `Lv.${level}`;

export const gradeLevelBadgeClass = (level: number): string => `grade-lv-${level}`;

export type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
export type TimeSlot = "MORNING" | "AFTERNOON" | "EVENING";

export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  MON: "월",
  TUE: "화",
  WED: "수",
  THU: "목",
  FRI: "금",
  SAT: "토",
  SUN: "일",
};

export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  MORNING: "오전",
  AFTERNOON: "오후",
  EVENING: "저녁",
};

export type SortOption = "recent" | "pick" | "career";

export interface BabysitterAvailability {
  dayOfWeek: DayOfWeek;
  timeSlot: TimeSlot;
}

export interface BabysitterProfile {
  email: string;
  name: string;
  careerYears: number;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  // /nearby 조회 시에만 채워짐 - 기준 좌표로부터 거리(km)
  distanceKm?: number;
  availableTime: string | null;
  hourlyRate: number | null;
  intro: string | null;
  profileImageFileName: string | null;
  status: "ACTIVE" | "INACTIVE";
  availability: BabysitterAvailability[];
  pickCount: number;
  selectionCount: number;
  gradeLevel: number;
  averageRating: number | null;
  reviewCount: number;
  regTime: string;
  modTime: string;
}

export interface BabysitterProfileInput {
  name: string;
  careerYears: number;
  region?: string;
  latitude?: number;
  longitude?: number;
  availableTime?: string;
  hourlyRate?: number;
  intro?: string;
  availability: BabysitterAvailability[];
}

export interface BabysitterSearchParam extends PageRequestParam {
  region?: string;
  keyword?: string;
  minCareerYears?: number;
  dayOfWeek?: DayOfWeek;
  timeSlot?: TimeSlot;
  sort?: SortOption;
}

export const getMine = async (): Promise<BabysitterProfile> => {
  const res = await jwtAxios.get(`${prefix}/me`);

  return res.data;
};

export const getOne = async (email: string): Promise<BabysitterProfile> => {
  const res = await jwtAxios.get(`${prefix}/${email}`);

  return res.data;
};

export const save = async (
  profile: BabysitterProfileInput,
): Promise<{ RESULT: string }> => {
  const res = await jwtAxios.put(`${prefix}/`, profile);

  return res.data;
};

export const remove = async (): Promise<{ RESULT: string }> => {
  const res = await jwtAxios.delete(`${prefix}/`);

  return res.data;
};

export const getList = async (
  searchParam: BabysitterSearchParam,
): Promise<PageResponse<BabysitterProfile>> => {
  const res = await jwtAxios.get(`${prefix}/list`, { params: searchParam });

  return res.data;
};

// 내 위치(lat, lng) 기준 반경 radiusKm(기본 5km) 안의 활동중인 시터, 가까운 순
export const getNearby = async (
  lat: number,
  lng: number,
  radiusKm = 5,
): Promise<BabysitterProfile[]> => {
  const res = await jwtAxios.get(`${prefix}/nearby`, {
    params: { lat, lng, radiusKm },
  });

  return res.data;
};

export const getMyPicks = async (): Promise<BabysitterProfile[]> => {
  const res = await jwtAxios.get(`${prefix}/picks/mine`);

  return res.data;
};

export const uploadPhoto = async (
  file: File,
): Promise<{ fileName: string }> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await jwtAxios.post(`${prefix}/me/photo`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
};

export interface BabysitterParentLocation {
  region: string;
  latitude: number | null;
  longitude: number | null;
}

export const getMyLocation = async (): Promise<BabysitterParentLocation> => {
  const res = await jwtAxios.get(`${locationPrefix}/`);

  return {
    region: res.data.region ?? "",
    latitude: res.data.latitude ?? null,
    longitude: res.data.longitude ?? null,
  };
};

export const saveMyLocation = async (
  region: string,
  latitude?: number,
  longitude?: number,
): Promise<{ RESULT: string }> => {
  const res = await jwtAxios.put(`${locationPrefix}/`, {
    region,
    latitude,
    longitude,
  });

  return res.data;
};

export const togglePick = async (
  email: string,
): Promise<{ picked: boolean }> => {
  const res = await jwtAxios.post(`${pickPrefix}/${email}`);

  return res.data;
};

export const isPicked = async (email: string): Promise<boolean> => {
  const res = await jwtAxios.get(`${pickPrefix}/${email}/mine`);

  return res.data.picked;
};

// ---------- 요청(선정) ----------

export type RequestStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELED";

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING: "대기중",
  ACCEPTED: "수락",
  REJECTED: "거절",
  CANCELED: "취소됨",
};

export const REQUEST_STATUS_BADGE_CLASS: Record<RequestStatus, string> = {
  PENDING: "pending",
  ACCEPTED: "safe",
  REJECTED: "danger",
  CANCELED: "danger",
};

export interface BabysitterRequest {
  requestNo: number;
  sitterEmail: string;
  sitterName: string | null;
  parentEmail: string;
  parentNickname: string | null;
  requestDate: string;
  timeSlot: TimeSlot;
  message: string | null;
  status: RequestStatus;
  reviewed: boolean;
  regTime: string;
  modTime: string;
}

export interface BabysitterRequestInput {
  sitterEmail: string;
  requestDate: string;
  timeSlot: TimeSlot;
  message?: string;
}

export const registerRequest = async (
  input: BabysitterRequestInput,
): Promise<{ requestNo: number }> => {
  const res = await jwtAxios.post(`${requestPrefix}/`, input);

  return res.data;
};

export const getReceivedRequests = async (): Promise<BabysitterRequest[]> => {
  const res = await jwtAxios.get(`${requestPrefix}/received`);

  return res.data;
};

export const getSentRequests = async (): Promise<BabysitterRequest[]> => {
  const res = await jwtAxios.get(`${requestPrefix}/sent`);

  return res.data;
};

export const acceptRequest = async (
  requestNo: number,
): Promise<{ RESULT: string }> => {
  const res = await jwtAxios.put(`${requestPrefix}/${requestNo}/accept`);

  return res.data;
};

export const rejectRequest = async (
  requestNo: number,
): Promise<{ RESULT: string }> => {
  const res = await jwtAxios.put(`${requestPrefix}/${requestNo}/reject`);

  return res.data;
};

export const cancelRequest = async (
  requestNo: number,
): Promise<{ RESULT: string }> => {
  const res = await jwtAxios.put(`${requestPrefix}/${requestNo}/cancel`);

  return res.data;
};

// 대기중인 내 요청의 날짜/시간대/메시지 수정
export const modifyRequest = async (
  requestNo: number,
  input: BabysitterRequestInput,
): Promise<{ RESULT: string }> => {
  const res = await jwtAxios.put(`${requestPrefix}/${requestNo}`, input);

  return res.data;
};

// 이미 예약이 잡힌(수락된) 날짜 목록 - 새 요청 폼에서 중복 예약 방지용
export const getBookedDates = async (sitterEmail: string): Promise<string[]> => {
  const res = await jwtAxios.get(`${requestPrefix}/sitter/${sitterEmail}/booked-dates`);

  return res.data;
};

// ---------- 후기 ----------

export interface BabysitterReview {
  reviewNo: number;
  requestNo: number;
  sitterEmail: string;
  writerNickname: string | null;
  rating: number;
  content: string | null;
  regTime: string;
}

export interface BabysitterReviewInput {
  requestNo: number;
  rating: number;
  content?: string;
}

export const registerReview = async (
  input: BabysitterReviewInput,
): Promise<{ reviewNo: number }> => {
  const res = await jwtAxios.post(`${reviewPrefix}/`, input);

  return res.data;
};

export const getReviewsBySitter = async (
  sitterEmail: string,
): Promise<BabysitterReview[]> => {
  const res = await jwtAxios.get(`${reviewPrefix}/sitter/${sitterEmail}`);

  return res.data;
};

// ---------- 구인글 (B안: 부모가 올리고 시터가 지원) ----------

export type JobStatus = "OPEN" | "CLOSED" | "CANCELED";

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  OPEN: "모집중",
  CLOSED: "마감",
  CANCELED: "취소됨",
};

export const JOB_STATUS_BADGE_CLASS: Record<JobStatus, string> = {
  OPEN: "safe",
  CLOSED: "pending",
  CANCELED: "danger",
};

export type JobApplicationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export const JOB_APPLICATION_STATUS_LABELS: Record<
  JobApplicationStatus,
  string
> = {
  PENDING: "대기중",
  ACCEPTED: "수락됨",
  REJECTED: "거절됨",
};

export const JOB_APPLICATION_STATUS_BADGE_CLASS: Record<
  JobApplicationStatus,
  string
> = {
  PENDING: "pending",
  ACCEPTED: "safe",
  REJECTED: "danger",
};

export interface BabysitterJobPost {
  jobNo: number;
  parentEmail: string;
  parentNickname: string | null;
  title: string;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  // /nearby 조회 시에만 채워짐 - 기준 좌표로부터 거리(km)
  distanceKm?: number;
  desiredDate: string;
  timeSlot: TimeSlot;
  hourlyRate: number | null;
  message: string | null;
  status: JobStatus;
  applicationCount: number;
  regTime: string;
  modTime: string;
}

export interface BabysitterJobPostInput {
  title: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  desiredDate: string;
  timeSlot: TimeSlot;
  hourlyRate?: number;
  message?: string;
}

export interface BabysitterJobSearchParam extends PageRequestParam {
  region?: string;
  desiredDate?: string;
  timeSlot?: TimeSlot;
  keyword?: string;
}

export interface BabysitterJobApplication {
  applicationNo: number;
  jobNo: number;
  jobTitle: string | null;
  sitterEmail: string;
  sitterName: string | null;
  message: string | null;
  status: JobApplicationStatus;
  regTime: string;
  modTime: string;
}

export const registerJobPost = async (
  input: BabysitterJobPostInput,
): Promise<{ jobNo: number }> => {
  const res = await jwtAxios.post(`${jobPrefix}/`, input);

  return res.data;
};

export const getJobList = async (
  searchParam: BabysitterJobSearchParam,
): Promise<PageResponse<BabysitterJobPost>> => {
  const res = await jwtAxios.get(`${jobPrefix}/list`, { params: searchParam });

  return res.data;
};

// 내 위치(lat, lng) 기준 반경 radiusKm(기본 5km) 안의 모집중인 구인글, 가까운 순
export const getNearbyJobs = async (
  lat: number,
  lng: number,
  radiusKm = 5,
): Promise<BabysitterJobPost[]> => {
  const res = await jwtAxios.get(`${jobPrefix}/nearby`, {
    params: { lat, lng, radiusKm },
  });

  return res.data;
};

export const getMyJobPosts = async (): Promise<BabysitterJobPost[]> => {
  const res = await jwtAxios.get(`${jobPrefix}/mine`);

  return res.data;
};

export const getJobOne = async (jobNo: number): Promise<BabysitterJobPost> => {
  const res = await jwtAxios.get(`${jobPrefix}/${jobNo}`);

  return res.data;
};

export const cancelJobPost = async (
  jobNo: number,
): Promise<{ RESULT: string }> => {
  const res = await jwtAxios.put(`${jobPrefix}/${jobNo}/cancel`);

  return res.data;
};

export const applyToJob = async (
  jobNo: number,
  message?: string,
): Promise<{ applicationNo: number }> => {
  const res = await jwtAxios.post(`${jobPrefix}/${jobNo}/applications`, {
    message,
  });

  return res.data;
};

export const getJobApplications = async (
  jobNo: number,
): Promise<BabysitterJobApplication[]> => {
  const res = await jwtAxios.get(`${jobPrefix}/${jobNo}/applications`);

  return res.data;
};

export const getMyApplications = async (): Promise<
  BabysitterJobApplication[]
> => {
  const res = await jwtAxios.get(`${jobPrefix}/applications/mine`);

  return res.data;
};

export const acceptJobApplication = async (
  jobNo: number,
  applicationNo: number,
): Promise<{ RESULT: string }> => {
  const res = await jwtAxios.put(
    `${jobPrefix}/${jobNo}/applications/${applicationNo}/accept`,
  );

  return res.data;
};

export const rejectJobApplication = async (
  jobNo: number,
  applicationNo: number,
): Promise<{ RESULT: string }> => {
  const res = await jwtAxios.put(
    `${jobPrefix}/${jobNo}/applications/${applicationNo}/reject`,
  );

  return res.data;
};
