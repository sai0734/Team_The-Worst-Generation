import { useEffect, useRef } from "react";
import type { MapCoordinate, PediatricHospital } from "../../types/hospital";
import { loadKakaoMapScript } from "../../util/kakaoMapLoader";

interface HospitalMapProps {
  hospitals: PediatricHospital[];
  userLocation: MapCoordinate | null;
  focusCenter: MapCoordinate;
  focusKey: number;
  selectedId: string | null;
  onSelect: (hospital: PediatricHospital) => void;
  onCenterChange: (center: MapCoordinate) => void;
}

const markerSvg = (selected: boolean): string =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${selected ? 42 : 34}" height="${selected ? 50 : 42}" viewBox="0 0 42 50"><defs><filter id="s" x="-30%" y="-20%" width="160%" height="170%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#14324d" flood-opacity=".22"/></filter></defs><path filter="url(#s)" d="M21 2C10.8 2 3 9.7 3 19.8 3 33 21 48 21 48s18-15 18-28.2C39 9.7 31.2 2 21 2z" fill="${selected ? "#005bb2" : "#ffffff"}" stroke="${selected ? "#ffffff" : "#6f8294"}" stroke-width="${selected ? 2.4 : 1.8}"/><circle cx="21" cy="20" r="10" fill="${selected ? "#ffffff" : "#edf2f6"}"/><path d="M19.3 14h3.4v4.3H27v3.4h-4.3V26h-3.4v-4.3H15v-3.4h4.3z" fill="${selected ? "#005bb2" : "#52687a"}"/></svg>`,
  )}`;

const HospitalMap = ({
  hospitals,
  userLocation,
  focusCenter,
  focusKey,
  selectedId,
  onSelect,
  onCenterChange,
}: HospitalMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Kakao Maps SDK does not provide TypeScript definitions in this project.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const appliedFocusKeyRef = useRef<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    let cancelled = false;

    const renderMap = async () => {
      await loadKakaoMapScript();
      if (cancelled || !containerRef.current) return;

      const center = new window.kakao.maps.LatLng(focusCenter.lat, focusCenter.lng);
      if (!mapRef.current) {
        mapRef.current = new window.kakao.maps.Map(containerRef.current, {
          center,
          level: 5,
          draggable: true,
          scrollwheel: true,
        });
        mapRef.current.setDraggable(true);
        mapRef.current.setZoomable(true);
        window.kakao.maps.event.addListener(mapRef.current, "idle", () => {
          const nextCenter = mapRef.current.getCenter();
          onCenterChange({ lat: nextCenter.getLat(), lng: nextCenter.getLng() });
        });
        appliedFocusKeyRef.current = focusKey;
      } else if (appliedFocusKeyRef.current !== focusKey) {
        mapRef.current.setDraggable(true);
        mapRef.current.setZoomable(true);
        mapRef.current.panTo(center);
        appliedFocusKeyRef.current = focusKey;
      }

      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];

      if (userLocation) {
        const userMarker = new window.kakao.maps.CustomOverlay({
          map: mapRef.current,
          position: new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng),
          content: '<div class="hospital-user-marker"><span></span></div>',
          zIndex: 5,
        });
        markersRef.current.push(userMarker);
      }

      hospitals.forEach((hospital) => {
        const isSelected = hospital.hospitalId === selectedId;
        const markerWidth = isSelected ? 42 : 34;
        const markerHeight = isSelected ? 50 : 42;
        const marker = new window.kakao.maps.Marker({
          map: mapRef.current,
          position: new window.kakao.maps.LatLng(hospital.latitude, hospital.longitude),
          image: new window.kakao.maps.MarkerImage(
            markerSvg(isSelected),
            new window.kakao.maps.Size(markerWidth, markerHeight),
            { offset: new window.kakao.maps.Point(markerWidth / 2, markerHeight) },
          ),
          zIndex: isSelected ? 4 : 2,
        });

        window.kakao.maps.event.addListener(marker, "click", () => onSelect(hospital));
        markersRef.current.push(marker);
      });
    };

    void renderMap();
    return () => {
      cancelled = true;
    };
  }, [focusCenter.lat, focusCenter.lng, focusKey, hospitals, onCenterChange, onSelect, selectedId, userLocation]);

  return <div ref={containerRef} className="hospital-map-canvas" />;
};

export default HospitalMap;
