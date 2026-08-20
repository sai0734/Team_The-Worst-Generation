import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as marketApi from "../../api/marketApi";
import type { MarketItem } from "../../api/marketApi";
import { loadKakaoMapScript } from "../../util/kakaoMapLoader";

interface MarketDetailSidebarProps {
  item: MarketItem;
}

const NEARBY_RADIUS_KM = 5;

// 카드 하나 (판매자의 다른 매물 / 근처 인기 중고거래 공용)
const MiniItemCard = ({ item }: { item: MarketItem }) => {
  const navigate = useNavigate();
  return (
    <article
      className="card market-card"
      onClick={() => navigate(`/market/${item.itemNo}`)}
    >
      <div className="thumb-wrap">
        {item.uploadFileNames && item.uploadFileNames.length > 0 ? (
          <img
            className="thumb"
            src={marketApi.getFileUrl(item.uploadFileNames[0])}
          />
        ) : (
          <div className="thumb-empty">사진 없음</div>
        )}
      </div>
      <div className="body">
        <p className="title">{item.title}</p>
        <span className="price">{item.price.toLocaleString()}원</span>
      </div>
    </article>
  );
};

// 상세페이지 하단: 같은 큰 카드 안에 이어서 "판매자의 다른 매물" / "OO동 근처 인기 중고거래" 섹션
const MarketDetailSidebar = ({ item }: MarketDetailSidebarProps) => {
  const [sellerItems, setSellerItems] = useState<MarketItem[]>([]);
  const [nearbyItems, setNearbyItems] = useState<MarketItem[]>([]);
  const [dongLabel, setDongLabel] = useState<string | null>(null);

  const hasCoords = item.latitude != null && item.longitude != null;

  // 판매자의 다른 매물 (현재 보고 있는 매물은 제외)
  useEffect(() => {
    if (!item.sellerEmail) return;
    marketApi
      .getItemsBySeller(item.sellerEmail)
      .then((list) =>
        setSellerItems(list.filter((i) => i.itemNo !== item.itemNo)),
      )
      .catch((err) => console.error(err));
  }, [item.sellerEmail, item.itemNo]);

  // 이 매물 좌표 근처 인기(조회수순) 중고거래 (현재 매물 제외)
  useEffect(() => {
    if (!hasCoords) return;
    marketApi
      .getNearbyItems(item.latitude!, item.longitude!, NEARBY_RADIUS_KM)
      .then((list) => {
        const others = list.filter((i) => i.itemNo !== item.itemNo);
        others.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
        setNearbyItems(others.slice(0, 6));
      })
      .catch((err) => console.error(err));
  }, [hasCoords, item.latitude, item.longitude, item.itemNo]);

  // 좌표 -> "??도 ??시 ??구 ??동" 라벨 (카카오 역지오코딩, 지도 표시는 MarketSellerQuickInfo가 담당)
  useEffect(() => {
    if (!hasCoords) return;
    let cancelled = false;

    loadKakaoMapScript()
      .then(() => {
        if (cancelled) return;

        const geocoder = new (window as any).kakao.maps.services.Geocoder();
        geocoder.coord2RegionCode(
          item.longitude,
          item.latitude,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (result: any[], status: string) => {
            if (
              cancelled ||
              status !== (window as any).kakao.maps.services.Status.OK
            ) {
              return;
            }
            const region =
              result.find((r) => r.region_type === "H") ?? result[0];
            if (region) {
              setDongLabel(
                `${region.region_1depth_name} ${region.region_2depth_name} ${region.region_3depth_name}`,
              );
            }
          },
        );
      })
      .catch((err) => console.error(err));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCoords, item.latitude, item.longitude]);

  return (
    <div className="detail-sections">
      {sellerItems.length > 0 && (
        <div className="detail-sidebar-section">
          <h3>{item.sellerEmail}님의 판매 물품</h3>
          <div className="market-grid detail-sidebar-grid">
            {sellerItems.map((i) => (
              <MiniItemCard key={i.itemNo} item={i} />
            ))}
          </div>
        </div>
      )}

      {nearbyItems.length > 0 && (
        <div className="detail-sidebar-section">
          <h3>{dongLabel ? `${dongLabel} 근처` : "근처"} 인기 중고거래</h3>
          <div className="market-grid detail-sidebar-grid">
            {nearbyItems.map((i) => (
              <MiniItemCard key={i.itemNo} item={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketDetailSidebar;
