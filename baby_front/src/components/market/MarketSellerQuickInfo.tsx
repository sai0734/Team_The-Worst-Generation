import { useEffect, useRef, useState } from "react";
import type { MarketItem } from "../../api/marketApi";
import * as marketProfileApi from "../../api/marketProfileApi";
import type { MarketProfile } from "../../api/marketProfileApi";
import { loadKakaoMapScript } from "../../util/kakaoMapLoader";

interface MarketSellerQuickInfoProps {
  item: MarketItem;
}

// 상세페이지 상단 우측: 판매자 매너온도 + 거래 위치 미니지도 (갤러리와 같은 줄, 같은 높이)
const MarketSellerQuickInfo = ({ item }: MarketSellerQuickInfoProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<MarketProfile | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const hasCoords = item.latitude != null && item.longitude != null;

  useEffect(() => {
    if (!item.sellerEmail) return;
    marketProfileApi
      .getProfile(item.sellerEmail)
      .then(setProfile)
      .catch((err) => console.error(err));
  }, [item.sellerEmail]);

  // 길찾기 링크에 "현재 위치"를 출발지로 같이 넣어주기 위한 위치 확인 (실패해도 도착지만으로 링크는 동작함)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        // 위치 권한 거부/실패 시 출발지 없이 도착지만으로 길찾기 링크 구성
      },
    );
  }, []);

  useEffect(() => {
    if (!hasCoords) return;
    let cancelled = false;

    loadKakaoMapScript()
      .then(() => {
        if (cancelled || !mapContainerRef.current) return;

        const position = new (window as any).kakao.maps.LatLng(
          item.latitude,
          item.longitude,
        );

        const map = new (window as any).kakao.maps.Map(
          mapContainerRef.current,
          {
            center: position,
            level: 4,
          },
        );
        map.setDraggable(false);
        map.setZoomable(false);

        new (window as any).kakao.maps.Marker({ position, map });
      })
      .catch((err) => console.error(err));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCoords, item.latitude, item.longitude]);

  const directionsUrl = hasCoords
    ? userLocation
      ? `https://map.kakao.com/link/from/${encodeURIComponent("현재 위치")},${userLocation.lat},${userLocation.lng}/to/${encodeURIComponent(item.title)},${item.latitude},${item.longitude}`
      : `https://map.kakao.com/link/to/${encodeURIComponent(item.title)},${item.latitude},${item.longitude}`
    : null;

  return (
    <div className="detail-quickinfo">
      {profile && (
        <div className="card market-profile-widget detail-quickinfo-manner">
          <div className="head">
            <h2 style={{ fontSize: 13 }}>{item.sellerEmail}님의 매너온도</h2>
            <b>{profile.mannerTemp.toFixed(1)}°C</b>
          </div>
          <div className="temp-bar">
            <div
              className="temp-fill"
              style={{
                width: `${Math.min(100, (profile.mannerTemp / 60) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {hasCoords && (
        <div ref={mapContainerRef} className="detail-quickinfo-map" />
      )}

      {directionsUrl && (
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="btn detail-quickinfo-directions"
        >
          길찾기
        </a>
      )}
    </div>
  );
};

export default MarketSellerQuickInfo;
