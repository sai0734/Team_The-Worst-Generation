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

  const hasCoords = item.latitude != null && item.longitude != null;

  useEffect(() => {
    if (!item.sellerEmail) return;
    marketProfileApi
      .getProfile(item.sellerEmail)
      .then(setProfile)
      .catch((err) => console.error(err));
  }, [item.sellerEmail]);

  useEffect(() => {
    if (!hasCoords) return;
    let cancelled = false;

    loadKakaoMapScript()
      .then(() => {
        if (cancelled || !mapContainerRef.current) return;

        const position = new (window as any).kakao.LatLng(
          item.latitude,
          item.longitude,
        );

        const map = new (window as any).kakao.Map(mapContainerRef.current, {
          center: position,
          level: 4,
        });
        map.setDraggable(false);
        map.setZoomable(false);

        new (window as any).kakao.Marker({ position, map });
      })
      .catch((err) => console.error(err));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCoords, item.latitude, item.longitude]);

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
    </div>
  );
};

export default MarketSellerQuickInfo;
