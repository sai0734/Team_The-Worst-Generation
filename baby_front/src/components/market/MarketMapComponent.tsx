import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as marketApi from "../../api/marketApi";
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
  // 마커 클릭 시 뜨는 매물 정보 팝업 (한 번에 하나만 떠있게)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeOverlayRef = useRef<any>(null);

  // center/items가 바뀔 때마다(홈에서 필터·위치가 바뀔 때마다) 지도를 다시 그림
  useEffect(() => {
    let cancelled = false;

    const closeItemPopup = () => {
      if (activeOverlayRef.current) {
        activeOverlayRef.current.setMap(null);
        activeOverlayRef.current = null;
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const openItemPopup = (item: MarketItem, position: any) => {
      closeItemPopup();

      const wrap = document.createElement("div");
      wrap.className = "map-item-popup";
      // 카카오맵이 드래그 감지용으로 지도 컨테이너의 mousedown/touchstart를 가로채서
      // 그 위에 얹은 팝업 안 버튼 클릭이 씹히는 문제 방지
      wrap.addEventListener("mousedown", (e) => e.stopPropagation());
      wrap.addEventListener("touchstart", (e) => e.stopPropagation());

      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "map-item-popup-close";
      closeBtn.textContent = "×";
      closeBtn.onclick = closeItemPopup;
      wrap.appendChild(closeBtn);

      if (item.uploadFileNames && item.uploadFileNames.length > 0) {
        const img = document.createElement("img");
        img.src = marketApi.getFileUrl(item.uploadFileNames[0]);
        wrap.appendChild(img);
      }

      const body = document.createElement("div");
      body.className = "map-item-popup-body";

      const title = document.createElement("p");
      title.className = "map-item-popup-title";
      title.textContent = item.title;
      body.appendChild(title);

      const goBtn = document.createElement("button");
      goBtn.type = "button";
      goBtn.textContent = "상세보기";
      goBtn.onclick = () => navigate(`/market/${item.itemNo}`);
      body.appendChild(goBtn);

      wrap.appendChild(body);

      const overlay = new (window as any).kakao.maps.CustomOverlay({
        position,
        content: wrap,
        yAnchor: 1.15,
        zIndex: 20,
      });

      overlay.setMap(mapRef.current);
      activeOverlayRef.current = overlay;
    };

    const render = async () => {
      await loadKakaoMapScript();
      if (cancelled || !mapContainerRef.current) return;

      const centerLatLng = new (window as any).kakao.maps.LatLng(
        center.lat,
        center.lng,
      );

      if (!mapRef.current) {
        mapRef.current = new (window as any).kakao.maps.Map(
          mapContainerRef.current,
          {
            center: centerLatLng,
            level: 6,
          },
        );

        // 지도 빈 곳 클릭하면 열려있던 팝업 닫기 (맵 인스턴스는 한 번만 생성되므로 여기서 한 번만 등록)
        (window as any).kakao.maps.event.addListener(
          mapRef.current,
          "click",
          closeItemPopup,
        );
      } else {
        mapRef.current.setCenter(centerLatLng);
      }

      overlaysRef.current.forEach((overlay) => overlay.setMap(null));
      overlaysRef.current = [];
      closeItemPopup();

      const myLocationImage = new (window as any).kakao.maps.MarkerImage(
        "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46"><path d="M18 0C8.1 0 0 8.1 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.1 27.9 0 18 0z" fill="#253e30"/><circle cx="18" cy="18" r="9" fill="#ffffff"/><circle cx="18" cy="18" r="5" fill="#5e9270"/></svg>',
          ),
        new (window as any).kakao.maps.Size(36, 46),
        { offset: new (window as any).kakao.maps.Point(18, 46) },
      );

      const myMarker = new (window as any).kakao.maps.Marker({
        position: centerLatLng,
        map: mapRef.current,
        image: myLocationImage,
        zIndex: 10,
      });
      overlaysRef.current.push(myMarker);

      const bounds = new (window as any).kakao.maps.LatLngBounds();
      bounds.extend(centerLatLng);

      items.forEach((item) => {
        if (item.latitude == null || item.longitude == null) return;

        const position = new (window as any).kakao.maps.LatLng(
          item.latitude,
          item.longitude,
        );

        const marker = new (window as any).kakao.maps.Marker({
          position,
          map: mapRef.current,
        });

        (window as any).kakao.event.addListener(marker, "click", () => {
          openItemPopup(item, position);
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
