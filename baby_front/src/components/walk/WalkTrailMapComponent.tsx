import { useEffect, useRef, useState } from "react";
import * as walkApi from "../../api/walkApi";
import type { WalkAiRecommendation, WalkPlace } from "../../types/walk";
import { loadKakaoMapScript } from "../../util/kakaoMapLoader";

const DEFAULT_CENTER = { lat: 37.566826, lng: 126.9786567 }; // 서울시청 (위치 정보 없을 때 기본값)

// 유모차 동반 도보 속도 기준(약 시속 3km). 직선거리 기준이라 실제보다 짧게 나올 수 있어 "약" 표기.
const STROLLER_WALK_SPEED_KMH = 3;

const formatDistance = (distanceKm?: number): string | null => {
  if (distanceKm === undefined) return null;
  return distanceKm < 1
    ? `${Math.round(distanceKm * 1000)}m`
    : `${distanceKm.toFixed(1)}km`;
};

const formatWalkMinutes = (distanceKm?: number): string | null => {
  if (distanceKm === undefined) return null;
  const minutes = Math.max(
    1,
    Math.round((distanceKm / STROLLER_WALK_SPEED_KMH) * 60),
  );
  return `도보 약 ${minutes}분`;
};

const buildDirectionsUrl = (
  origin: { lat: number; lng: number },
  place: WalkPlace,
) => {
  const destination = `${encodeURIComponent(place.name)},${place.latitude},${place.longitude}`;
  return `https://map.kakao.com/link/from/${encodeURIComponent("출발지")},${origin.lat},${origin.lng}/to/${destination}`;
};

const openRouteWindow = (
  origin: { lat: number; lng: number },
  place: WalkPlace,
) => {
  const url = buildDirectionsUrl(origin, place);
  window.open(url, "walkRoute", "width=480,height=760,noopener,noreferrer");
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
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [locationHint, setLocationHint] = useState<string | null>(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<WalkAiRecommendation | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

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
      (err) => {
        if (cancelled) return;
        if (err.code === err.PERMISSION_DENIED) {
          setLocationHint(
            "위치 권한이 차단되어 있어요. 주소창의 자물쇠 아이콘 → 위치 → 허용으로 바꾸면 자동으로 인식됩니다.",
          );
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  // center가 바뀔 때마다(최초 마운트 + 위치 확인/선택 완료 시) 지도 초기화/이동
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setMapLoading(true);
      setMapError(null);

      try {
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

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).kakao.maps.event.addListener(
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

        overlaysRef.current.forEach((overlay) => overlay.setMap(null));
        overlaysRef.current = [];

        const myLocationImage = new (window as any).kakao.maps.MarkerImage(
          "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(
              '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46"><path d="M18 0C8.1 0 0 8.1 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.1 27.9 0 18 0z" fill="#005bb2"/><circle cx="18" cy="18" r="9" fill="#ffffff"/><circle cx="18" cy="18" r="5" fill="#7fb2e6"/></svg>',
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
      } catch (err) {
        console.error(err);
        if (!cancelled) setMapError("지도를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setMapLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng]);

  const fetchAiRecommendation = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await walkApi.getAiRecommendation(center.lat, center.lng);
      setAiResult(result);
    } catch (err) {
      console.error(err);
      setAiError("AI 추천을 불러오지 못했습니다.");
    } finally {
      setAiLoading(false);
    }
  };

  const sourceLabel =
    locationSource === "gps"
      ? "현재 위치 기준"
      : locationSource === "manual"
        ? "직접 선택한 위치 기준"
        : "기본 위치(서울시청) 기준";

  return (
    <div className="card">
      <div className="head">
        <h2>AI 산책로 추천</h2>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 11, color: "var(--muted)" }}>
            {sourceLabel}
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
          {locationHint && (
            <p style={{ color: "#ef6262", fontSize: 12, width: "100%" }}>
              {locationHint}
            </p>
          )}
        </div>
      </div>

      {mapError && <p style={{ color: "#ef6262", fontSize: 13 }}>{mapError}</p>}

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
            gap: 12,
            maxHeight: 460,
            overflowY: "auto",
          }}
        >
          <button
            type="button"
            className="btn"
            onClick={fetchAiRecommendation}
            disabled={aiLoading || mapLoading}
            style={{ flexShrink: 0 }}
          >
            {aiLoading ? "추천 받는 중..." : "AI 추천받기"}
          </button>

          {aiError && (
            <p style={{ color: "#ef6262", fontSize: 13 }}>{aiError}</p>
          )}

          {!aiResult && !aiLoading && !aiError && (
            <p className="empty-hint">
              위치를 선택하고 "AI 추천받기"를 눌러보세요.
            </p>
          )}

          {aiResult && (
            <>
              {(aiResult.temperature || aiResult.humidity) && (
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    fontSize: 12,
                    color: "var(--muted)",
                  }}
                >
                  {aiResult.temperature && (
                    <span>🌡 {aiResult.temperature}°C</span>
                  )}
                  {aiResult.precipitationType && (
                    <span>☔ {aiResult.precipitationType}</span>
                  )}
                  {aiResult.humidity && (
                    <span>💧 습도 {aiResult.humidity}%</span>
                  )}
                </div>
              )}
              <p style={{ fontSize: 13, lineHeight: 1.5 }}>{aiResult.answer}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {aiResult.places.map((place) => (
                  <div
                    key={place.name + place.address}
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
                      <strong style={{ fontSize: 14 }}>{place.name}</strong>
                      <span className="status-badge available">
                        {formatDistance(place.distanceM / 1000)} ·{" "}
                        {formatWalkMinutes(place.distanceM / 1000)}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--muted)",
                        marginTop: 4,
                      }}
                    >
                      {place.address}
                    </p>
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => openRouteWindow(center, place)}
                      style={{
                        display: "inline-block",
                        marginTop: 8,
                        fontSize: 12,
                      }}
                    >
                      경로보기
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalkTrailMapComponent;
