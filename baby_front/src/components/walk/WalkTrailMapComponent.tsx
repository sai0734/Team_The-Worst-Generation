import { useEffect, useRef, useState } from "react";
import * as walkApi from "../../api/walkApi";
import type { WalkTrail } from "../../types/walk";
import { loadKakaoMapScript } from "../../util/kakaoMapLoader";

const DEFAULT_CENTER = { lat: 37.566826, lng: 126.9786567 }; // 서울시청 (위치 정보 없을 때 기본값)
const RADIUS_KM = 5;
const LIMIT = 5;

const formatDistance = (distanceKm?: number): string | null => {
  if (distanceKm === undefined) return null;
  return distanceKm < 1
    ? `${Math.round(distanceKm * 1000)}m`
    : `${distanceKm.toFixed(1)}km`;
};

type LocationSource = "gps" | "manual" | "default";

const WalkTrailMapComponent = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overlaysRef = useRef<any[]>([]);
  const pickModeRef = useRef(false);

  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [locationSource, setLocationSource] =
    useState<LocationSource>("default");
  const [locating, setLocating] = useState(false);
  const [pickMode, setPickMode] = useState(false);
  const [trails, setTrails] = useState<WalkTrail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    pickModeRef.current = pickMode;
  }, [pickMode]);

  const useGpsLocation = () => {
    if (!navigator.geolocation) {
      alert("이 브라우저는 위치 기능을 지원하지 않습니다.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationSource("gps");
        setLocating(false);
        setPickMode(false);
      },
      () => {
        alert(
          "위치 정보를 가져오지 못했습니다. 아래 '지도 클릭으로 위치 설정' 버튼으로 직접 선택해주세요.",
        );
        setLocating(false);
      },
    );
  };

  // 최초 1회 - GPS 우선 시도, 실패하면 기본값(서울시청) 유지
  useEffect(() => {
    if (!navigator.geolocation) return;

    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationSource("gps");
      },
      () => {
        // 기본 좌표(서울시청) 유지 - 사용자가 직접 클릭으로 설정 가능
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  // center가 바뀔 때마다(최초 마운트 + 위치 확인/선택 완료 시) 지도 초기화/이동 + 주변 산책로 재조회
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setLoading(true);
      setError(null);

      try {
        await loadKakaoMapScript();
        if (cancelled || !mapContainerRef.current) return;

        const centerLatLng = new window.kakao.maps.LatLng(
          center.lat,
          center.lng,
        );

        if (!mapRef.current) {
          mapRef.current = new window.kakao.maps.Map(mapContainerRef.current, {
            center: centerLatLng,
            level: 6,
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          window.kakao.maps.event.addListener(
            mapRef.current,
            "click",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (mouseEvent: any) => {
              if (!pickModeRef.current) return;
              const latlng = mouseEvent.latLng;
              setCenter({ lat: latlng.getLat(), lng: latlng.getLng() });
              setLocationSource("manual");
              setPickMode(false);
            },
          );
        } else {
          mapRef.current.setCenter(centerLatLng);
        }

        const nearbyTrails = await walkApi.getNearbyTrails(
          center.lat,
          center.lng,
          RADIUS_KM,
          LIMIT,
        );
        if (cancelled) return;
        setTrails(nearbyTrails);

        overlaysRef.current.forEach((overlay) => overlay.setMap(null));
        overlaysRef.current = [];

        const myLocationImage = new window.kakao.maps.MarkerImage(
          "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(
              '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46"><path d="M18 0C8.1 0 0 8.1 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.1 27.9 0 18 0z" fill="#005bb2"/><circle cx="18" cy="18" r="9" fill="#ffffff"/><circle cx="18" cy="18" r="5" fill="#7fb2e6"/></svg>',
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

        nearbyTrails.forEach((trail) => {
          const marker = new window.kakao.maps.Marker({
            position: new window.kakao.maps.LatLng(
              trail.latitude,
              trail.longitude,
            ),
            map: mapRef.current,
          });

          const infowindow = new window.kakao.maps.InfoWindow({
            content: `<div style="padding:6px 10px;font-size:12px;">${trail.name}</div>`,
          });

          window.kakao.maps.event.addListener(marker, "mouseover", () => {
            infowindow.open(mapRef.current, marker);
          });
          window.kakao.maps.event.addListener(marker, "mouseout", () => {
            infowindow.close();
          });

          overlaysRef.current.push(marker);
        });
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("지도를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng]);

  const sourceLabel =
    locationSource === "gps"
      ? "현재 위치 기준"
      : locationSource === "manual"
        ? "직접 선택한 위치 기준"
        : "기본 위치(서울시청) 기준";

  return (
    <div className="card">
      <div className="head">
        <h2>내 주변 산책로</h2>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 11, color: "var(--muted)" }}>
            {sourceLabel} 반경 {RADIUS_KM}km
          </span>
          <button
            type="button"
            className="btn ghost"
            onClick={useGpsLocation}
            disabled={locating}
          >
            {locating ? "위치 확인 중..." : "현재 위치로 보기"}
          </button>
          <button
            type="button"
            className={pickMode ? "btn" : "btn ghost"}
            onClick={() => setPickMode((prev) => !prev)}
          >
            {pickMode ? "지도를 클릭하세요" : "지도 클릭으로 위치 설정"}
          </button>
        </div>
      </div>

      {error && <p style={{ color: "#ef6262", fontSize: 13 }}>{error}</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: 16,
          marginTop: 14,
        }}
      >
        <div
          ref={mapContainerRef}
          style={{
            width: "100%",
            height: 460,
            borderRadius: 20,
            overflow: "hidden",
            border: pickMode
              ? "2px solid var(--accent)"
              : "1px solid var(--line)",
            cursor: pickMode ? "crosshair" : "default",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            maxHeight: 460,
            overflowY: "auto",
          }}
        >
          {loading && <p className="empty-hint">불러오는 중...</p>}

          {!loading && trails.length === 0 && !error && (
            <p className="empty-hint">주변에 등록된 산책로가 없습니다.</p>
          )}

          {trails.map((trail) => (
            <div
              key={trail.trailNo}
              className="card"
              style={{ padding: "12px 14px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 8,
                }}
              >
                <strong style={{ fontSize: 14 }}>{trail.name}</strong>
                {formatDistance(trail.distanceKm) && (
                  <span className="status-badge available">
                    {formatDistance(trail.distanceKm)}
                  </span>
                )}
              </div>
              {trail.locationName && (
                <p
                  style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}
                >
                  {trail.locationName}
                </p>
              )}
              {trail.description && (
                <p style={{ fontSize: 13, marginTop: 6 }}>
                  {trail.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WalkTrailMapComponent;
