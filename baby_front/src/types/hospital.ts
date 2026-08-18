export interface MapCoordinate {
  lat: number;
  lng: number;
}

export interface HospitalKakaoMapTarget {
  name: string;
  latitude: number;
  longitude: number;
}

export interface PediatricHospital {
  hospitalId: string;
  hospitalName: string;
  address: string;
  hospitalType: string;
  mainPhone: string | null;
  emergencyPhone: string | null;
  distance: number | null;
  latitude: number;
  longitude: number;
  startTime: string | null;
  endTime: string | null;
  availableEmergencyBeds: number | null;
  availableOperatingRooms: number | null;
  pediatricVentilatorAvailable: boolean | null;
  incubatorAvailable: boolean | null;
  ctAvailable: boolean | null;
  mriAvailable: boolean | null;
  ventilatorAvailable: boolean | null;
  updatedAt: string | null;
  waitingPatientCount: number | null;
  waitingChange: number | null;
  kakaoMapTarget: HospitalKakaoMapTarget | null;
}

export interface HospitalSearchRequest {
  longitude: number;
  latitude: number;
  stage1: string;
  stage2: string;
  pageNo: number;
  numOfRows: number;
}

export interface HospitalWaitingCount {
  hospitalId: string;
  waitingPatientCount: number;
  waitingChange: number;
}

export interface HospitalWaitingRefreshResponse {
  refreshLimited: boolean;
  retryAfterSeconds: number;
  hospitals: HospitalWaitingCount[];
}
