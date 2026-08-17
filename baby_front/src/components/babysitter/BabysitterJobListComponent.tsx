import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as babysitterApi from "../../api/babysitterApi";
import { JOB_STATUS_LABELS, JOB_STATUS_BADGE_CLASS, TIME_SLOT_LABELS } from "../../api/babysitterApi";
import type { BabysitterJobPost, TimeSlot } from "../../api/babysitterApi";
import type { PageResponse } from "../../types/page";
import type { MovePageParam } from "../../hooks/useCustomMove";
import PageComponent from "../common/PageComponent";

const DEFAULT_CENTER = { lat: 37.566826, lng: 126.9786567 }; // 서울시청 (내 시터 프로필 위치도 GPS도 없을 때 기본값)
const RADIUS_KM = 5;

type ViewMode = "search" | "nearby";
type CenterSource = "profile" | "gps" | "default";

const BabysitterJobListComponent = () => {
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<ViewMode>("search");

  const [region, setRegion] = useState("");
  const [desiredDate, setDesiredDate] = useState("");
  const [timeSlot, setTimeSlot] = useState<TimeSlot | "">("");
  const [keyword, setKeyword] = useState("");
  const [pageResponse, setPageResponse] =
    useState<PageResponse<BabysitterJobPost> | null>(null);

  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [centerSource, setCenterSource] = useState<CenterSource>("default");
  const [locating, setLocating] = useState(false);
  const [nearbyList, setNearbyList] = useState<BabysitterJobPost[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  const loadList = async (pageNum: number) => {
    const res = await babysitterApi.getJobList({
      page: pageNum,
      size: 10,
      region: region || undefined,
      desiredDate: desiredDate || undefined,
      timeSlot: timeSlot || undefined,
      keyword: keyword || undefined,
    });

    setPageResponse(res);
  };

  const loadNearby = async (lat: number, lng: number) => {
    setNearbyLoading(true);
    try {
      const list = await babysitterApi.getNearbyJobs(lat, lng, RADIUS_KM);
      setNearbyList(list);
    } catch (err) {
      console.error(err);
    } finally {
      setNearbyLoading(false);
    }
  };

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
        alert("위치 정보를 가져오지 못했습니다. 브라우저 위치 권한을 허용해주세요.");
        setLocating(false);
      },
    );
  };

  useEffect(() => {
    loadList(1);

    // 내 시터 프로필에 등록된 위치가 있으면 "내 주변" 탭의 기본 기준점으로 사용
    babysitterApi
      .getMine()
      .then((profile) => {
        if (profile.latitude != null && profile.longitude != null) {
          setCenter({ lat: profile.latitude, lng: profile.longitude });
          setCenterSource("profile");
        }
      })
      .catch(() => {
        // 시터 프로필이 없으면 기본값/GPS로 대체
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "내 주변" 탭으로 바뀌거나 기준 좌표가 바뀔 때마다 재조회
  useEffect(() => {
    if (viewMode === "nearby") {
      loadNearby(center.lat, center.lng);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, center.lat, center.lng]);

  const movePage = (pageParam?: MovePageParam) => {
    loadList(pageParam?.page ?? 1);
  };

  const sourceLabel =
    centerSource === "profile"
      ? "내 시터 프로필 위치 기준"
      : centerSource === "gps"
        ? "현재 위치 기준"
        : "기본 위치(서울시청) 기준";

  return (
    <div>
      <div className="recall-header">
        <h2>돌봄 구인글</h2>
        <div className="sitter-header-actions">
          <button
            type="button"
            className="btn ghost"
            onClick={() => navigate("/community/babysitter/jobs/mine")}
          >
            내가 올린 구인글
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => navigate("/community/babysitter/jobs/applications/mine")}
          >
            내가 지원한 구인글
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => navigate("/community/babysitter/jobs/write")}
          >
            구인글 작성
          </button>
        </div>
      </div>

      <div className="seg" style={{ marginBottom: 16 }}>
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

      {viewMode === "search" ? (
        <>
          <div className="sitter-filter-bar">
            <input
              placeholder="지역"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
            <input
              type="date"
              value={desiredDate}
              onChange={(e) => setDesiredDate(e.target.value)}
            />
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value as TimeSlot | "")}
            >
              <option value="">시간대 무관</option>
              {(Object.keys(TIME_SLOT_LABELS) as TimeSlot[]).map((slot) => (
                <option key={slot} value={slot}>
                  {TIME_SLOT_LABELS[slot]}
                </option>
              ))}
            </select>
            <input
              placeholder="검색어"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <button type="button" className="btn ghost" onClick={() => loadList(1)}>
              검색
            </button>
          </div>

          {pageResponse && pageResponse.dtoList.length === 0 && (
            <div className="empty-hint">모집중인 구인글이 없습니다.</div>
          )}

          <div className="sitter-list">
            {pageResponse?.dtoList.map((job) => (
              <article
                key={job.jobNo}
                className="card sitter-row"
                onClick={() => navigate(`/community/babysitter/jobs/${job.jobNo}`)}
              >
                <div className="sitter-row-body">
                  <div className="name-row">
                    {job.title}
                    <span className={`badge ${JOB_STATUS_BADGE_CLASS[job.status]}`}>
                      {JOB_STATUS_LABELS[job.status]}
                    </span>
                  </div>
                  <div className="meta">
                    {job.desiredDate} ({TIME_SLOT_LABELS[job.timeSlot]}) · {job.region ?? "지역 미입력"}
                  </div>
                  <div className="meta">
                    {job.hourlyRate ? `시급 ${job.hourlyRate.toLocaleString()}원` : "시급 협의"} · 지원 {job.applicationCount}명
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
              {sourceLabel} 반경 {RADIUS_KM}km · 서로 5km 이내인 구인글만 보여드려요
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

          {nearbyLoading ? (
            <div className="empty-hint">불러오는 중...</div>
          ) : nearbyList.length === 0 ? (
            <div className="empty-hint">
              반경 {RADIUS_KM}km 안에 모집중인 구인글이 없습니다.
            </div>
          ) : (
            <div className="sitter-list">
              {nearbyList.map((job) => (
                <article
                  key={job.jobNo}
                  className="card sitter-row"
                  onClick={() => navigate(`/community/babysitter/jobs/${job.jobNo}`)}
                >
                  <div className="sitter-row-body">
                    <div className="name-row">
                      {job.title}
                      <span className={`badge ${JOB_STATUS_BADGE_CLASS[job.status]}`}>
                        {JOB_STATUS_LABELS[job.status]}
                      </span>
                    </div>
                    <div className="meta">
                      {job.distanceKm != null && `내 위치에서 ${job.distanceKm.toFixed(1)}km`}
                      {" · "}
                      {job.desiredDate} ({TIME_SLOT_LABELS[job.timeSlot]})
                    </div>
                    <div className="meta">
                      {job.hourlyRate ? `시급 ${job.hourlyRate.toLocaleString()}원` : "시급 협의"} · 지원 {job.applicationCount}명
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      <div className="sitter-back-link">
        <button type="button" className="btn ghost" onClick={() => navigate("/community/babysitter")}>
          시터 목록으로
        </button>
      </div>
    </div>
  );
};

export default BabysitterJobListComponent;
