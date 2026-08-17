import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { MarketItem } from "../../api/marketApi";
import { loadKakaoMapScript } from "../../util/kakaoMapLoader";

interface MarketMapComponentProps {
  items: MarketItem[];
  center: { lat: number; lng: number };
}

const MarketMapComponent = ({ items, center }: MarketMapComponentProps) => {
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overlaysRef = useRef<any[]>([]);

  // center/items가 바뀔 때마다(홈에서 필터·위치가 바뀔 때마다) 지도를 다시 그림
  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      await loadKakaoMapScript();
      if (cancelled || !mapContainerRef.current) return;

      const centerLatLng = new window.kakao.maps.LatLng(center.lat, center.lng);

      if (!mapRef.current) {
        mapRef.current = new window.kakao.maps.Map(mapContainerRef.current, {
          center: centerLatLng,
          level: 5,
        });
      } else {
        mapRef.current.setCenter(centerLatLng);
      }

      overlaysRef.current.forEach((overlay) => overlay.setMap(null));
      overlaysRef.current = [];

      const myLocationImage = new window.kakao.maps.MarkerImage(
        "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46"><path d="M18 0C8.1 0 0 8.1 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.1 27.9 0 18 0z" fill="#253e30"/><circle cx="18" cy="18" r="9" fill="#ffffff"/><circle cx="18" cy="18" r="5" fill="#5e9270"/></svg>',
          ),
        new window.kakao.maps.Size(36, 46),
        { offset: new window.kakao.maps.Point(18, 46) },
      );

      const myMarker = new window.kakao.maps.Marker({
        position: centerLatLng,
        map: mapRef.current,
        image: myLocationImage,
        zIndex: 10,
      });
      overlaysRef.current.push(myMarker);

      const bounds = new window.kakao.maps.LatLngBounds();
      bounds.extend(centerLatLng);

      items.forEach((item) => {
        if (item.latitude == null || item.longitude == null) return;

        const position = new window.kakao.maps.LatLng(
          item.latitude,
          item.longitude,
        );

        const marker = new window.kakao.maps.Marker({
          position,
          map: mapRef.current,
        });

        window.kakao.maps.event.addListener(marker, "click", () => {
          navigate(`/market/${item.itemNo}`);
        });

        overlaysRef.current.push(marker);
        bounds.extend(position);
      });

      if (items.length > 0) {
        mapRef.current.setBounds(bounds);
      }
    };

    render().catch((err) => console.error(err));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, center.lat, center.lng]);

  return (
    <div
      ref={mapContainerRef}
      className="market-map-canvas"
      style={{ width: "100%", height: "100%", minHeight: 500 }}
    />
  );
};

export default MarketMapComponent;
