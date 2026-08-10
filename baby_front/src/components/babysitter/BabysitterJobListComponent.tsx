import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as babysitterApi from "../../api/babysitterApi";
import { TIME_SLOT_LABELS } from "../../api/babysitterApi";
import type { BabysitterJobPost, TimeSlot } from "../../api/babysitterApi";
import type { PageResponse } from "../../types/page";
import type { MovePageParam } from "../../hooks/useCustomMove";
import PageComponent from "../common/PageComponent";

const BabysitterJobListComponent = () => {
  const navigate = useNavigate();

  const [region, setRegion] = useState("");
  const [desiredDate, setDesiredDate] = useState("");
  const [timeSlot, setTimeSlot] = useState<TimeSlot | "">("");
  const [keyword, setKeyword] = useState("");
  const [pageResponse, setPageResponse] =
    useState<PageResponse<BabysitterJobPost> | null>(null);

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

  useEffect(() => {
    loadList(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const movePage = (pageParam?: MovePageParam) => {
    loadList(pageParam?.page ?? 1);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold">돌봄 구인글</h2>
        <div className="flex gap-2">
          <button onClick={() => navigate("/community/babysitter/jobs/mine")}>
            내가 올린 구인글
          </button>
          <button
            onClick={() => navigate("/community/babysitter/jobs/applications/mine")}
          >
            내가 지원한 구인글
          </button>
          <button onClick={() => navigate("/community/babysitter/jobs/write")}>
            구인글 작성
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
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
        <button onClick={() => loadList(1)}>검색</button>
      </div>

      {pageResponse && pageResponse.dtoList.length === 0 && (
        <div>모집중인 구인글이 없습니다.</div>
      )}

      <ul>
        {pageResponse?.dtoList.map((job) => (
          <li
            key={job.jobNo}
            className="border-b py-2 cursor-pointer"
            onClick={() => navigate(`/community/babysitter/jobs/${job.jobNo}`)}
          >
            <div className="font-bold">{job.title}</div>
            <div>
              {job.desiredDate} ({TIME_SLOT_LABELS[job.timeSlot]}) · {job.region ?? "지역 미입력"}
            </div>
            <div>
              {job.hourlyRate ? `시급 ${job.hourlyRate.toLocaleString()}원` : "시급 협의"} · 지원 {job.applicationCount}명
            </div>
          </li>
        ))}
      </ul>

      {pageResponse && (
        <PageComponent serverData={pageResponse} movePage={movePage} />
      )}

      <button onClick={() => navigate("/community/babysitter")} className="mt-3">
        시터 목록으로
      </button>
    </div>
  );
};

export default BabysitterJobListComponent;
