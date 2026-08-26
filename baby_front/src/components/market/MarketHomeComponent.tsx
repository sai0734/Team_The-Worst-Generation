import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as marketApi from "../../api/marketApi";
import { MARKET_CATEGORIES } from "../../api/marketApi";
import type { MarketItem } from "../../api/marketApi";
import * as marketProfileApi from "../../api/marketProfileApi";
import type { MarketProfile } from "../../api/marketProfileApi";
import * as wishApi from "../../api/wishApi";
import useCustomLogin from "../../hooks/useCustomLogin";
import MarketMapComponent from "./MarketMapComponent";
import { formatRelativeTime } from "../../util/relativeTime";
import { DEFAULT_MAP_CENTER, GEO_OPTIONS } from "../../util/mapLocation";
import "../../styles/market.css";

const CATEGORY_FILTERS = ["전체", ...MARKET_CATEGORIES];
const RADIUS_KM = 5;

type ListFilter = "nearby" | "wish";

const MarketHomeComponent = () => {
  const navigate = useNavigate();
  const { isLogin } = useCustomLogin();

  const [category, setCategory] = useState("전체");
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [listFilter, setListFilter] = useState<ListFilter>("nearby");
  const [center, setCenter] = useState(DEFAULT_MAP_CENTER);
  const [locating, setLocating] = useState(false);
  const [items, setItems] = useState<MarketItem[]>([]);
  const [wishedSet, setWishedSet] = useState<Set<number>>(new Set());
  const [profile, setProfile] = useState<MarketProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [hoveredItemNo, setHoveredItemNo] = useState<number | null>(null);

  const useGpsLocation = () => {
    if (!navigator.geolocation) {
      alert("이 브라우저는 위치 기능을 지원하지 않습니다.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        alert(
          "위치 정보를 가져오지 못했습니다. 브라우저 위치 권한을 허용해주세요.",
        );
        setLocating(false);
      },
      GEO_OPTIONS,
    );
  };

  // 닉네임/매너온도 위젯에 쓸 내 프로필 정보 로드 (위치와는 무관)
  useEffect(() => {
    if (!isLogin) return;

    marketProfileApi
      .getMyProfile()
      .then(setProfile)
      .catch((err) => console.error(err));
  }, [isLogin]);

  // 로그인 상태일 때만 자동으로 현재 위치를 시도 - 로그인 전에는 기본값(서울시청) 유지,
  // 로그인 후이거나 "현재 위치로 보기"를 눌렀을 때만 실제 GPS 위치로 이동
  useEffect(() => {
    if (!isLogin || !navigator.geolocation) return;

    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        // 기본 좌표(서울시청) 유지
      },
      GEO_OPTIONS,
    );

    return () => {
      cancelled = true;
    };
  }, [isLogin]);

  // 로그인 상태일 때 내 찜 목록을 한 번 받아서 하트 표시에 사용
  useEffect(() => {
    if (!isLogin) return;

    wishApi.getMyWishList().then((list) => {
      setWishedSet(new Set(list.map((w) => w.itemNo)));
    });
  }, [isLogin]);

  // 필터(근처/내찜, 카테고리, 검색어) 또는 중심좌표가 바뀔 때마다 목록 재조회
  // (카테고리/검색어는 nearby 조회일 때만 서버로 넘김 - 내 찜목록은 어차피 목록이 작아서 클라이언트에서 거름)
  useEffect(() => {
    let cancelled = false;

    const loadList = async () => {
      if (listFilter === "wish" && !isLogin) {
        setItems([]);
        return;
      }

      setLoading(true);
      try {
        if (listFilter === "wish") {
          const wishList = await wishApi.getMyWishList();
          const detailList = await Promise.all(
            wishList.map((w) => marketApi.getItem(w.itemNo)),
          );
          if (!cancelled) {
            setItems(detailList);
            setWishedSet(new Set(wishList.map((w) => w.itemNo)));
          }
        } else {
          const nearby = await marketApi.getNearbyItems(
            center.lat,
            center.lng,
            RADIUS_KM,
            category,
            appliedSearch,
          );
          if (!cancelled) setItems(nearby);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadList();

    return () => {
      cancelled = true;
    };
  }, [listFilter, center.lat, center.lng, isLogin, category, appliedSearch]);

  const toggleWish = async (itemNo?: number) => {
    if (!itemNo) return;
    const wished = await wishApi.toggleWish(itemNo);
    setWishedSet((prev) => {
      const next = new Set(prev);
      if (wished) next.add(itemNo);
      else next.delete(itemNo);
      return next;
    });
  };

  const handleEditNickname = async () => {
    const next = prompt(
      "홈에 표시할 이름을 입력해주세요.",
      profile?.nickname ?? "",
    );
    if (next === null) return;

    const trimmed = next.trim();
    if (!trimmed) return;

    await marketProfileApi.changeNickname(trimmed);
    setProfile((prev) => (prev ? { ...prev, nickname: trimmed } : prev));
  };

  const runSearch = () => setAppliedSearch(searchText);

  const normalizedSearch = appliedSearch.trim().toLowerCase();

  const filteredItems =
    listFilter === "wish"
      ? items
          .filter((item) => category === "전체" || item.category === category)
          .filter((item) => {
            if (!normalizedSearch) return true;
            const title = item.title?.toLowerCase() ?? "";
            const description = item.description?.toLowerCase() ?? "";
            return (
              title.includes(normalizedSearch) ||
              description.includes(normalizedSearch)
            );
          })
      : items;

  return (
    <div className="market-home">
      <div className="card">
      <div className="market-home-split">
        <div className="market-home-list-pane">
          <div className="market-home-filter">
            <div className="seg">
              <button
                type="button"
                className={listFilter === "nearby" ? "is-active" : ""}
                onClick={() => setListFilter("nearby")}
              >
                근처 매물
              </button>
              <button
                type="button"
                className={listFilter === "wish" ? "is-active" : ""}
                onClick={() => setListFilter("wish")}
              >
                내찜목록
              </button>
            </div>
            <div className="market-search-bar">
              <input
                type="text"
                className="market-search-input"
                placeholder="제목이나 설명으로 검색"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") runSearch();
                }}
              />
              <button
                type="button"
                className="btn market-search-btn"
                onClick={runSearch}
              >
                검색
              </button>
            </div>
          </div>

          <div className="market-grid market-home-grid">
            {listFilter === "wish" && !isLogin ? (
              <div className="card">로그인이 필요한 목록입니다.</div>
            ) : loading ? (
              <div className="card">불러오는 중...</div>
            ) : filteredItems.length === 0 ? (
              <div className="card">표시할 매물이 없습니다.</div>
            ) : (
              filteredItems.map((item) => (
                <article
                  className="card market-card"
                  key={item.itemNo}
                  onClick={() => navigate(`/market/${item.itemNo}`)}
                  onMouseEnter={() => setHoveredItemNo(item.itemNo ?? null)}
                  onMouseLeave={() =>
                    setHoveredItemNo((prev) =>
                      prev === item.itemNo ? null : prev,
                    )
                  }
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
                    <span className="card-tag">
                      {item.tradeType === "RENTAL" ? "대여" : "판매"}
                    </span>
                    {isLogin && (
                      <button
                        className={`wish-btn${
                          item.itemNo && wishedSet.has(item.itemNo)
                            ? " active"
                            : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWish(item.itemNo);
                        }}
                      >
                        {item.itemNo && wishedSet.has(item.itemNo) ? "♥" : "♡"}
                      </button>
                    )}
                  </div>
                  <div className="body">
                    <p className="brand">{item.category}</p>
                    <p className="title">{item.title}</p>
                    <div className="price-row">
                      <span className="price">
                        {item.price.toLocaleString()}원
                      </span>
                      <span
                        className={`status-badge ${
                          item.status === "거래완료" ? "done" : "available"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="reg-time">
                      {formatRelativeTime(item.regTime)}
                    </p>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="market-home-map-pane">
          {isLogin && profile && (
            <div className="card market-profile-widget">
              <div className="head">
                <h2>{profile.nickname || "이름 설정하기"}</h2>
                <button
                  type="button"
                  className="btn ghost profile-nickname-btn"
                  onClick={handleEditNickname}
                >
                  이름 수정
                </button>
              </div>
              <div className="head profile-manner-row">
                <span className="profile-manner-label">매너온도</span>
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

          <div className="market-home-map-canvas-wrap">
            <div className="market-map-overlay-topleft">
              {CATEGORY_FILTERS.map((c) => (
                <span
                  key={c}
                  className={`chip${category === c ? " is-active" : ""}`}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </span>
              ))}
            </div>

            <button
              type="button"
              className="btn ghost market-map-overlay-topright"
              onClick={useGpsLocation}
              disabled={locating}
            >
              {locating ? "위치 확인 중..." : "현재 위치로 보기"}
            </button>

            <MarketMapComponent
              items={filteredItems}
              center={center}
              hoveredItemNo={hoveredItemNo}
            />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default MarketHomeComponent;
