import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as marketApi from "../../api/marketApi";
import type { MarketItem } from "../../api/marketApi";
import * as marketProfileApi from "../../api/marketProfileApi";
import useCustomLogin from "../../hooks/useCustomLogin";
import { loadKakaoMapScript } from "../../util/kakaoMapLoader";

const DEFAULT_CENTER = { lat: 37.566826, lng: 126.9786567 }; // 서울시청 (내 동네도 GPS도 없을 때 기본값)
const RADIUS_KM = 5;

const formatDistance = (distanceKm?: number): string | null => {
  if (distanceKm === undefined) return null;
  return distanceKm < 1
    ? `${Math.round(distanceKm * 1000)}m`
    : `${distanceKm.toFixed(1)}km`;
};

type CenterSource = "profile" | "gps" | "default";

const MarketMapComponent = () => {
  const navigate = useNavigate();
  const { isLogin } = useCustomLogin();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overlaysRef = useRef<any[]>([]);

  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [centerSource, setCenterSource] = useState<CenterSource>("default");
  const [locating, setLocating] = useState(false);
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const useGpsLocation = () => {
    if (!navigator.geolocation) {
      alert("이 브라우저는 위치 기능을 지원하지 않습니다.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setCenterSource("gps");
        setLocating(false);
      },
      () => {
        alert(
          "위치 정보를 가져오지 못했습니다. 브라우저 위치 권한을 허용해주세요.",
        );
        setLocating(false);
      },
    );
  };

  // 최초 1회 - 로그인 상태면 "내 동네"(MarketProfile) 우선 사용, 없으면 GPS, 그것도 안 되면 기본값 유지
  useEffect(() => {
    let cancelled = false;

    const resolveInitialCenter = async () => {
      if (isLogin) {
        try {
          const profile = await marketProfileApi.getMyProfile();
          if (
            !cancelled &&
            profile.latitude != null &&
            profile.longitude != null
          ) {
            setCenter({ lat: profile.latitude, lng: profile.longitude });
            setCenterSource("profile");
            return;
          }
        } catch (err) {
          console.error(err);
        }
      }

      if (cancelled || !navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return;
          setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setCenterSource("gps");
        },
        () => {
          // 기본 좌표(서울시청) 유지
        },
      );
    };

    resolveInitialCenter();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLogin]);

  // center가 바뀔 때마다(최초 마운트 + 위치 확인 완료 시) 지도 초기화/이동 + 주변 매물 재조회
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
            level: 5,
          });
        } else {
          mapRef.current.setCenter(centerLatLng);
        }

        const nearbyItems = await marketApi.getNearbyItems(
          center.lat,
          center.lng,
          RADIUS_KM,
        );
        if (cancelled) return;
        setItems(nearbyItems);

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

        nearbyItems.forEach((item) => {
          if (item.latitude == null || item.longitude == null) return;

          const marker = new window.kakao.maps.Marker({
            position: new window.kakao.maps.LatLng(
              item.latitude,
              item.longitude,
            ),
            map: mapRef.current,
          });

          window.kakao.maps.event.addListener(marker, "click", () => {
            navigate(`/market/${item.itemNo}`);
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
    centerSource === "profile"
      ? "내 동네 기준"
      : centerSource === "gps"
        ? "현재 위치 기준"
        : "기본 위치(서울시청) 기준";

  return (
    <div className="market-map-layout">
      <div className="market-map-header">
        <h2>내 주변 매물</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="market-map-sub">
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
        </div>
      </div>

      {error && <div className="card">{error}</div>}

      <div className="market-map-body" style={{ minHeight: 500 }}>
        <div
          ref={mapContainerRef}
          className="market-map-canvas"
          style={{ width: "100%", height: 500 }}
        />

        <div className="market-map-list">
          {loading && <div className="card">불러오는 중...</div>}

          {!loading && items.length === 0 && !error && (
            <div className="card">주변에 등록된 매물이 없습니다.</div>
          )}

          {items.map((item) => (
            <article
              key={item.itemNo}
              className="market-map-item"
              onClick={() => navigate(`/market/${item.itemNo}`)}
            >
              <div className="market-map-item-thumb">
                {item.uploadFileNames && item.uploadFileNames.length > 0 ? (
                  <img src={marketApi.getFileUrl(item.uploadFileNames[0])} />
                ) : (
                  <div
                    className="thumb-empty"
                    style={{ width: "100%", height: "100%" }}
                  >
                    사진 없음
                  </div>
                )}
              </div>
              <div className="market-map-item-body">
                <p className="market-map-item-title">{item.title}</p>
                <div className="market-map-item-meta">
                  <span className="price">{item.price.toLocaleString()}원</span>
                  <span className="status-badge available">
                    {item.tradeType === "RENTAL" ? "대여" : "판매"}
                    {formatDistance(item.distanceKm) &&
                      ` · ${formatDistance(item.distanceKm)}`}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketMapComponent;
