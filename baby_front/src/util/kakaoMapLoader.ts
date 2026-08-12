// 카카오맵 SDK는 전역 스크립트로 로드돼서 타입 정의가 따로 없음 - any로 취급
declare global {
  interface Window {
    kakao: any;
  }
}

let kakaoLoadPromise: Promise<void> | null = null;

// 페이지에 스크립트를 한 번만 붙이면 되므로 모듈 스코프에서 캐싱해서
// MarketMapComponent / MarketLocationPicker 양쪽에서 공용으로 씀
export const loadKakaoMapScript = (): Promise<void> => {
  if (window.kakao && window.kakao.maps) {
    return Promise.resolve();
  }
  if (kakaoLoadPromise) {
    return kakaoLoadPromise;
  }

  kakaoLoadPromise = new Promise((resolve, reject) => {
    const appkey = import.meta.env.VITE_KAKAO_MAP_API_KEY;
    const script = document.createElement("script");
    // libraries=services -> 좌표 <-> 주소 변환(역지오코딩)에 필요
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appkey}&libraries=services&autoload=false`;
    script.onload = () => window.kakao.maps.load(() => resolve());
    script.onerror = () => {
      kakaoLoadPromise = null;
      reject(new Error("카카오맵 스크립트 로드 실패"));
    };
    document.head.appendChild(script);
  });

  return kakaoLoadPromise;
};
