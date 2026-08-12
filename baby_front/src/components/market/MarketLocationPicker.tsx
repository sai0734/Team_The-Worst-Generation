import { useEffect, useRef, useState } from "react";
import { loadKakaoMapScript } from "../../util/kakaoMapLoader";

interface Props {
  initialLat?: number;
  initialLng?: number;
  onConfirm: (locationName: string, lat: number, lng: number) => void;
}

const DEFAULT_CENTER = { lat: 37.566826, lng: 126.9786567 }; // 서울시청

// 지도를 드래그해서 중앙 핀 위치 = 내 동네로 설정하는 피커.
// 당근마켓의 "동네 설정" 화면과 같은 방식 (지도 중앙이 곧 선택 위치, 핀은 항상 화면 중앙 고정).
const MarketLocationPicker = ({ initialLat, initialLng, onConfirm }: Props) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const geocoderRef = useRef<any>(null);

  const [ready, setReady] = useState(false);
  const [addressPreview, setAddressPreview] = useState("");

  useEffect(() => {
    let cancelled = false;

    const updateAddressPreview = () => {
      if (!mapRef.current || !geocoderRef.current) return;
      const center = mapRef.current.getCenter();
      geocoderRef.current.coord2Address(
        center.getLng(),
        center.getLat(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (result: any[], status: string) => {
          if (cancelled) return;
          if (status === window.kakao.maps.services.Status.OK && result[0]) {
            setAddressPreview(result[0].address.address_name);
          }
        },
      );
    };

    const setupMap = (center: { lat: number; lng: number }) => {
      if (!mapContainerRef.current) return;

      mapRef.current = new window.kakao.maps.Map(mapContainerRef.current, {
        center: new window.kakao.maps.LatLng(center.lat, center.lng),
        level: 4,
      });
      geocoderRef.current = new window.kakao.maps.services.Geocoder();

      window.kakao.maps.event.addListener(
        mapRef.current,
        "idle",
        updateAddressPreview,
      );

      setReady(true);
      updateAddressPreview();
    };

    const init = async () => {
      await loadKakaoMapScript();
      if (cancelled) return;

      const hasInitial = initialLat != null && initialLng != null;

      if (hasInitial) {
        setupMap({ lat: initialLat as number, lng: initialLng as number });
        return;
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (cancelled) return;
            setupMap({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          () => {
            if (cancelled) return;
            setupMap(DEFAULT_CENTER);
          },
        );
      } else {
        setupMap(DEFAULT_CENTER);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirm = () => {
    if (!mapRef.current) return;
    const center = mapRef.current.getCenter();
    onConfirm(addressPreview || "", center.getLat(), center.getLng());
  };

  return (
    <div className="location-picker">
      <div ref={mapContainerRef} className="location-picker-canvas" />
      <div className="location-picker-pin" />
      <div className="location-picker-footer">
        <span className="location-picker-preview">
          {ready
            ? addressPreview || "지도를 움직여 동네를 선택하세요"
            : "지도를 불러오는 중..."}
        </span>
        <button
          type="button"
          className="btn"
          onClick={handleConfirm}
          disabled={!ready}
        >
          이 위치로 동네 설정
        </button>
      </div>
    </div>
  );
};

export default MarketLocationPicker;
