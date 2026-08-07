import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as babysitterApi from "../../api/babysitterApi";
import {
  DAY_OF_WEEK_LABELS,
  GRADE_LABELS,
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

const DAYS = Object.keys(DAY_OF_WEEK_LABELS) as DayOfWeek[];
const SLOTS = Object.keys(TIME_SLOT_LABELS) as TimeSlot[];

const SORT_LABELS: Record<SortOption, string> = {
  recent: "최근 등록순",
  pick: "픽 많은순",
  career: "경력 많은순",
};

const BabysitterListComponent = () => {
  const navigate = useNavigate();
  const { isLogin } = useCustomLogin();

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

  useEffect(() => {
    if (isLogin) {
      babysitterApi
        .getMyLocation()
        .then((savedRegion) => {
          setMyLocation(savedRegion);
          setLocationInput(savedRegion);
          setRegion(savedRegion);
          loadList(1, savedRegion);
        })
        .catch(() => {
          loadList(1);
        });
    } else {
      loadList(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const movePage = (pageParam?: MovePageParam) => {
    loadList(pageParam?.page ?? 1);
  };

  const handleSaveLocation = async () => {
    await babysitterApi.saveMyLocation(locationInput);
    setMyLocation(locationInput);
    setRegion(locationInput);
    setEditingLocation(false);
    loadList(1, locationInput);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold">베이비시터 찾기</h2>
        {isLogin && (
          <div className="flex gap-2">
            <button onClick={() => navigate("/community/babysitter/my-picks")}>
              내가 찜한 시터
            </button>
            <button onClick={() => navigate("/community/babysitter/requests/sent")}>
              내가 보낸 요청
            </button>
            <button
              onClick={() => navigate("/community/babysitter/requests/received")}
            >
              나에게 온 요청
            </button>
            <button onClick={() => navigate("/community/babysitter/me/edit")}>
              내 프로필 등록/수정
            </button>
          </div>
        )}
      </div>

      {isLogin && (
        <div className="mb-3 text-sm">
          내 동네:{" "}
          {editingLocation ? (
            <>
              <input
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="예: 역삼동"
              />
              <button onClick={handleSaveLocation}>저장</button>
              <button type="button" onClick={() => setEditingLocation(false)}>
                취소
              </button>
            </>
          ) : (
            <>
              <b>{myLocation || "미설정"}</b>{" "}
              <button
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

      <div className="flex gap-2 mb-3 flex-wrap">
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
        <button onClick={() => loadList(1)}>검색</button>
      </div>

      {pageResponse && pageResponse.dtoList.length === 0 && (
        <div>조건에 맞는 시터가 없습니다.</div>
      )}

      <ul>
        {pageResponse?.dtoList.map((profile) => (
          <li
            key={profile.email}
            className="border-b py-2 cursor-pointer flex gap-3"
            onClick={() => navigate(`/community/babysitter/${profile.email}`)}
          >
            {profile.profileImageFileName && (
              <img
                src={babysitterApi.getFileUrl(profile.profileImageFileName)}
                className="w-14 h-14 rounded-full object-cover"
              />
            )}
            <div>
              <div className="font-bold">
                {profile.name}{" "}
                <span className="text-xs font-normal bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                  {GRADE_LABELS[profile.grade]}
                </span>{" "}
                <span className="text-xs font-normal text-gray-500">
                  픽 {profile.pickCount}
                  {profile.averageRating != null &&
                    ` · ★${profile.averageRating.toFixed(1)} (${profile.reviewCount})`}
                </span>
              </div>
              <div>
                경력 {profile.careerYears}년 · {profile.region ?? "지역 미입력"}
              </div>
              <div>
                {profile.hourlyRate
                  ? `시급 ${profile.hourlyRate.toLocaleString()}원`
                  : "시급 협의"}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {pageResponse && (
        <PageComponent serverData={pageResponse} movePage={movePage} />
      )}
    </div>
  );
};

export default BabysitterListComponent;
