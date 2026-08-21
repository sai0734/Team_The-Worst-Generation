import jwtAxios from "../util/jwtUtil";
import type {
  HospitalReservationRequest,
  HospitalReservationResponse,
  HospitalSearchRequest,
  HospitalWaitingRefreshResponse,
  MapCoordinate,
  PediatricHospital,
} from "../types/hospital";

const API_SERVER_HOST = "http://localhost:8080";
const hospitalHost = `${API_SERVER_HOST}/api/hospitals`;

export const getNearbyPediatricHospitals = async (
  center: MapCoordinate,
): Promise<PediatricHospital[]> => {
  const request: HospitalSearchRequest = {
    longitude: center.lng,
    latitude: center.lat,
    stage1: "",
    stage2: "",
    pageNo: 1,
    numOfRows: 50,
  };

  const response = await jwtAxios.post<PediatricHospital[]>(`${hospitalHost}/search`, request);

  return response.data
    .filter((hospital) => hospital.hospitalType?.includes("소아"))
    .sort((left, right) => (left.distance ?? Number.MAX_VALUE) - (right.distance ?? Number.MAX_VALUE));
};

export const refreshHospitalWaitingCounts = async (
  hospitalIds: string[],
): Promise<HospitalWaitingRefreshResponse> => {
  const response = await jwtAxios.post<HospitalWaitingRefreshResponse>(
    `${hospitalHost}/waiting/refresh`,
    { hospitalIds },
  );

  return response.data;
};

export const registerHospitalReservation = async (
  request: HospitalReservationRequest,
): Promise<HospitalReservationResponse> => {
  const response = await jwtAxios.post<HospitalReservationResponse>(
    `${hospitalHost}/reservations/`,
    request,
  );

  return response.data;
};
