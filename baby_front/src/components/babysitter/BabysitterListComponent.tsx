import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as babysitterApi from "../../api/babysitterApi";
import {
  DAY_OF_WEEK_LABELS,
  gradeLevelBadgeClass,
  gradeLevelLabel,
  TIME_SLOT_LABELS,
} from "../../api/babysitterApi";
import type {
  BabysitterProfile,
  DayOfWeek,
  SortOption,
  TimeSlot,
} from "../../api/babysitterApi";
import type { PageResponse } from "../../types/page";
import type { MovePageParam } from "../../hooks/useCustomMove";
import PageComponent from "../common/PageComponent";
import useCustomLogin from "../../hooks/useCustomLogin";
import BabysitterMapComponent from "./BabysitterMapComponent";

const DAYS = Object.keys(DAY_OF_WEEK_LABELS) as DayOfWeek[];
const SLOTS = Object.keys(TIME_SLOT_LABELS) as TimeSlot[];

const SORT_LABELS: Record<SortOption, string> = {
  recent: "최근 등록순",
  pick: "찜 많은순",
  career: "경력 많은순",
};

const DEFAULT_CENTER = { lat: 37.566826, lng: 126.9786567 }; // 서울시청 (내 동네도 GPS도 없을 때 기본값)
const RADIUS_KM = 5;

type ViewMode = "search" | "nearby";
type CenterSource = "profile" | "gps" | "default";

const BabysitterListComponent = () => {
  const navigate = useNavigate();
  const { isLogin } = useCustomLogin();

  const [viewMode, setViewMode] = useState<ViewMode>("search");

  const [region, setRegion] = useState("");
  const [keyword, setKeyword] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek | "">("");
  const [timeSlot, setTimeSlot] = useState<TimeSlot | "">("");
  const [sort, setSort] = useState<SortOption>("recent");
  const [pageResponse, setPageResponse] =
    useState<PageResponse<BabysitterProfile> | null>(null);

  const [myLocation, setMyLocation] = useState("");
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationInput, setLocationInput] = useState("");

  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [centerSource, setCenterSource] = useState<CenterSource>("default");
  const [locating, setLocating] = useState(false);
  const [nearbyList, setNearbyList] = useState<BabysitterProfile[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  const loadList = async (pageNum: number, regionOverride?: string) => {
    const res = await babysitterApi.getList({
      page: pageNum,
      size: 10,
      region: (regionOverride ?? region) || undefined,
      keyword: keyword || undefined,
      dayOfWeek: dayOfWeek || undefined,
      timeSlot: timeSlot || undefined,
      sort,
    });

    setPageResponse(res);
  };

  const loadNearby = async (lat: number, lng: number) => {
    setNearbyLoading(true);
    try {
      const list = await babysitterApi.getNearby(lat, lng, RADIUS_KM);
      setNearbyList(list);
    } catch (err) {
      console.error(err);
    } finally {
      setNearbyLoading(false);
    }
  };

  const fetchGpsLocation = () => {
    if (!navigator.geolocation) {
      // GPS를 못 쓰면 기존 기준 좌표(내 동네 또는 기본값)로 그대로 진행
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
        // 위치 권한 거부/실패 시에도 기존 기준 좌표로 계속 진행
        setLocating(false);
      },
    );
  };

  useEffect(() => {
    if (isLogin) {
      babysitterApi
        .getMyLocation()
        .then((saved) => {
          setMyLocation(saved.region);
          setLocationInput(saved.region);
          setRegion(saved.region);
          loadList(1, saved.region);

          if (saved.latitude != null && saved.longitude != null) {
            setCenter({ lat: saved.latitude, lng: saved.longitude });
            setCenterSource("profile");
          }
        })
        .catch(() => {
          loadList(1);
        });
    } else {
      loadList(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "내 주변" 탭으로 들어오면 바로 GPS로 현재 위치를 다시 파악
  useEffect(() => {
    if (viewMode === "nearby") {
      fetchGpsLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  // "내 주변" 탭이거나 기준 좌표가 바뀔 때마다(GPS로 갱신됐을 때 포함) 재조회
  useEffect(() => {
    if (viewMode === "nearby") {
      loadNearby(center.lat, center.lng);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, center.lat, center.lng]);

  const movePage = (pageParam?: MovePageParam) => {
    loadList(pageParam?.page ?? 1);
  };

  const handleSaveLocation = async () => {
    await babysitterApi.saveMyLocation(
      locationInput,
      centerSource !== "default" ? center.lat : undefined,
      centerSource !== "default" ? center.lng : undefined,
    );
    setMyLocation(locationInput);
    setRegion(locationInput);
    setEditingLocation(false);
    loadList(1, locationInput);
  };

  const sourceLabel = locating
    ? "현재 위치 확인 중..."
    : centerSource === "profile"
      ? "내 동네 기준"
      : centerSource === "gps"
        ? "현재 위치 기준"
        : "기본 위치(서울시청) 기준";

  return (
    <div>
      <div className="recall-header">
        <h2>베이비시터 찾기</h2>
      </div>

      <div className="sitter-toolbar-row">
        <div className="seg">
          <button
            type="button"
            className={viewMode === "search" ? "is-active" : ""}
            onClick={() => setViewMode("search")}
          >
            검색
          </button>
          <button
            type="button"
            className={viewMode === "nearby" ? "is-active" : ""}
            onClick={() => setViewMode("nearby")}
          >
            내 주변
          </button>
        </div>

        {isLogin && (
          <div className="sitter-location-row">
            내 동네:{" "}
            {editingLocation ? (
              <>
                <input
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="예: 역삼동"
                />
                <button type="button" className="btn ghost" onClick={handleSaveLocation}>
                  저장
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setEditingLocation(false)}
                >
                  취소
                </button>
              </>
            ) : (
              <>
                <b>{myLocation || "미설정"}</b>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => {
                    setLocationInput(myLocation);
                    setEditingLocation(true);
                  }}
                >
                  변경
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {viewMode === "search" ? (
        <>
          <div className="sitter-filter-bar">
            <input
              placeholder="지역"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
            <input
              placeholder="이름/소개 검색"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek | "")}
            >
              <option value="">요일 무관</option>
              {DAYS.map((day) => (
                <option key={day} value={day}>
                  {DAY_OF_WEEK_LABELS[day]}
                </option>
              ))}
            </select>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value as TimeSlot | "")}
            >
              <option value="">시간대 무관</option>
              {SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {TIME_SLOT_LABELS[slot]}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
            >
              {(Object.keys(SORT_LABELS) as SortOption[]).map((s) => (
                <option key={s} value={s}>
                  {SORT_LABELS[s]}
                </option>
              ))}
            </select>
            <button type="button" className="btn ghost" onClick={() => loadList(1)}>
              검색
            </button>
          </div>

          {pageResponse && pageResponse.dtoList.length === 0 && (
            <div className="empty-hint">조건에 맞는 시터가 없습니다.</div>
          )}

          <div className="sitter-list">
            {pageResponse?.dtoList.map((profile) => (
              <article
                key={profile.email}
                className="card sitter-row"
                onClick={() => navigate(`/community/babysitter/${profile.email}`)}
              >
                {profile.profileImageFileName && (
                  <img
                    src={babysitterApi.getFileUrl(profile.profileImageFileName)}
                    className="sitter-avatar"
                  />
                )}
                <div className="sitter-row-body">
                  <div className="name-row">
                    {profile.name}
                    <span className={`community-badge ${gradeLevelBadgeClass(profile.gradeLevel)}`}>
                      {gradeLevelLabel(profile.gradeLevel)}
                    </span>
                  </div>
                  <div className="meta">
                    찜 {profile.pickCount} · 선정 {profile.selectionCount}회
                    {profile.averageRating != null &&
                      ` · ★${profile.averageRating.toFixed(1)} (${profile.reviewCount})`}
                  </div>
                  <div className="meta">
                    경력 {profile.careerYears}년 · {profile.region ?? "지역 미입력"}
                  </div>
                  <div className="meta">
                    {profile.hourlyRate
                      ? `시급 ${profile.hourlyRate.toLocaleString()}원`
                      : "시급 협의"}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {pageResponse && (
            <PageComponent serverData={pageResponse} movePage={movePage} />
          )}
        </>
      ) : (
        <>
          <div className="sitter-location-row">
            <span className="meta">
              {sourceLabel} 반경 {RADIUS_KM}km · 신뢰할 수 있게 가까운 시터만 보여드려요
            </span>
          </div>

          <div className="sitter-nearby-split">
            <div className="sitter-nearby-list-pane">
              {nearbyLoading ? (
                <div className="empty-hint">불러오는 중...</div>
              ) : nearbyList.length === 0 ? (
                <div className="empty-hint">
                  반경 {RADIUS_KM}km 안에 위치를 등록한 시터가 없습니다.
                </div>
              ) : (
                <div className="sitter-list">
                  {nearbyList.map((profile) => (
                    <article
                      key={profile.email}
                      className="card sitter-row"
                      onClick={() => navigate(`/community/babysitter/${profile.email}`)}
                    >
                      {profile.profileImageFileName && (
                        <img
                          src={babysitterApi.getFileUrl(profile.profileImageFileName)}
                          className="sitter-avatar"
                        />
                      )}
                      <div className="sitter-row-body">
                        <div className="name-row">
                          {profile.name}
                          <span className={`community-badge ${gradeLevelBadgeClass(profile.gradeLevel)}`}>
                            {gradeLevelLabel(profile.gradeLevel)}
                          </span>
                        </div>
                        <div className="meta">
                          {profile.distanceKm != null && `내 위치에서 ${profile.distanceKm.toFixed(1)}km`}
                          {profile.averageRating != null &&
                            ` · ★${profile.averageRating.toFixed(1)} (${profile.reviewCount})`}
                        </div>
                        <div className="meta">
                          선정 {profile.selectionCount}회 · 경력 {profile.careerYears}년 · {profile.region ?? "지역 미입력"}
                        </div>
                        <div className="meta">
                          {profile.hourlyRate
                            ? `시급 ${profile.hourlyRate.toLocaleString()}원`
                            : "시급 협의"}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <BabysitterMapComponent sitters={nearbyList} center={center} />
          </div>
        </>
      )}
    </div>
  );
};

export default BabysitterListComponent;
