import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as communityApi from "../../api/communityApi";
import type { CommunityPost } from "../../api/communityApi";
import type { PageResponse } from "../../types/page";
import type { MovePageParam } from "../../hooks/useCustomMove";
import PageComponent from "../common/PageComponent";
import useCustomLogin from "../../hooks/useCustomLogin";

const CommunityListComponent = () => {
  const navigate = useNavigate();
  const { isLogin } = useCustomLogin();

  const [keyword, setKeyword] = useState("");
  const [pageResponse, setPageResponse] =
    useState<PageResponse<CommunityPost> | null>(null);

  const loadList = async (pageNum: number) => {
    const res = await communityApi.getList({
      page: pageNum,
      size: 10,
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
        <h2 className="text-xl font-bold">자유게시판</h2>
        {isLogin && (
          <button onClick={() => navigate("/community/write")}>글쓰기</button>
        )}
      </div>

      <div className="flex gap-2 mb-3">
        <input
          placeholder="제목/내용 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button onClick={() => loadList(1)}>검색</button>
      </div>

      {pageResponse && pageResponse.dtoList.length === 0 && (
        <div>등록된 글이 없습니다.</div>
      )}

      <ul>
        {pageResponse?.dtoList.map((post) => (
          <li
            key={post.postNo}
            className="border-b py-2 cursor-pointer"
            onClick={() => navigate(`/community/${post.postNo}`)}
          >
            <div className="font-bold">{post.title}</div>
            <div>
              {post.nickname} · 조회 {post.viewCount} · 댓글 {post.commentCount}
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

export default CommunityListComponent;
