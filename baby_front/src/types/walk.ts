export interface WalkTrail {
  trailNo?: number;
  name: string;
  description?: string;
  locationName?: string;
  latitude: number;
  longitude: number;
  // /nearby 조회 시에만 채워짐 - 기준 좌표로부터의 거리 (km)
  distanceKm?: number;
  regTime?: string;
}
