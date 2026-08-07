import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as babysitterApi from "../../api/babysitterApi";
import type { BabysitterProfile } from "../../api/babysitterApi";
import type { PageResponse } from "../../types/page";
import type { MovePageParam } from "../../hooks/useCustomMove";
import PageComponent from "../common/PageComponent";

const BabysitterListComponent = () => {
  const navigate = useNavigate();

  const [region, setRegion] = useState("");
  const [keyword, setKeyword] = useState("");
  const [pageResponse, setPageResponse] =
    useState<PageResponse<BabysitterProfile> | null>(null);

  const loadList = async (pageNum: number) => {
    const res = await babysitterApi.getList({
      page: pageNum,
      size: 10,
      region: region || undefined,
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
        <h2 className="text-xl font-bold">베이비시터 찾기</h2>
        <button onClick={() => navigate("/babysitter/me/edit")}>
          내 프로필 등록/수정
        </button>
      </div>

      <div className="flex gap-2 mb-3">
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
        <button onClick={() => loadList(1)}>검색</button>
      </div>

      {pageResponse && pageResponse.dtoList.length === 0 && (
        <div>등록된 시터가 없습니다.</div>
      )}

      <ul>
        {pageResponse?.dtoList.map((profile) => (
          <li
            key={profile.email}
            className="border-b py-2 cursor-pointer"
            onClick={() => navigate(`/babysitter/${profile.email}`)}
          >
            <div className="font-bold">{profile.name}</div>
            <div>
              경력 {profile.careerYears}년 · {profile.region ?? "지역 미입력"}
            </div>
            <div>
              {profile.hourlyRate
                ? `시급 ${profile.hourlyRate.toLocaleString()}원`
                : "시급 협의"}
              {" · "}
              {profile.availableTime ?? "가능시간 미입력"}
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
