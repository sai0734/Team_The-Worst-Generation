// 감자마켓/병원/산책로 추천 지도 페이지가 공통으로 쓰는 "내 위치" 기준값.
// 로그인 상태가 아니거나 GPS를 못 구했을 때는 항상 이 좌표(서울시청)로 통일한다.
export const DEFAULT_MAP_CENTER = { lat: 37.566826, lng: 126.9786567 };

export const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 20000,
  maximumAge: 0,
};
