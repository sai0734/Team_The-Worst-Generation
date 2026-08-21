import jwtAxios from "../util/jwtUtil";
import type { EmergencySosRequest, EmergencySosResult } from "../types/emergency";

const API_SERVER_HOST = "http://localhost:8080";
const emergencyHost = `${API_SERVER_HOST}/api/emergency-rooms`;

export const requestEmergencySOS = async (
  request: EmergencySosRequest,
): Promise<EmergencySosResult> => {
  const response = await jwtAxios.post<EmergencySosResult>(
    `${emergencyHost}/sos`,
    request,
  );

  return response.data;
};
