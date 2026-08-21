export interface EmergencySosRequest {
  longitude: number;
  latitude: number;
  stage1: string;
  stage2: string;
  pageNo: number;
  numOfRows: number;
  notificationPhone: string;
}

export interface EmergencySosHospital {
  hospitalId: string;
  hospitalName: string;
  address: string;
  emergencyPhone: string | null;
  mainPhone: string | null;
  distance: number | null;
}

export interface EmergencySosResult {
  selectedHospital: EmergencySosHospital;
}
