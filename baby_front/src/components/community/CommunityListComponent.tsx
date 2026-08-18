import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as communityApi from "../../api/communityApi";
import { CATEGORY_BADGE_CLASS } from "../../api/communityApi";
import type { CommunityPost } from "../../api/communityApi";
import type { PageResponse } from "../../types/page";
import type { MovePageParam } from "../../hooks/useCustomMove";
import PageComponent from "../common/PageComponent";
import useCustomLogin from "../../hooks/useCustomLogin";

const EXCERPT_MAX_LENGTH = 60;

const excerptOf = (content: string): string =>
  content.length > EXCERPT_MAX_LENGTH
    ? `${content.slice(0, EXCERPT_MAX_LENGTH)}…`
    : content;

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
      <div className="recall-header">
        <h2>자유게시판</h2>
        {isLogin && (
          <button
            type="button"
            className="btn"
            onClick={() => navigate("/community/write")}
          >
            글쓰기
          </button>
        )}
      </div>

      <div className="community-search">
        <input
          placeholder="제목/내용 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loadList(1)}
        />
        <button type="button" className="btn ghost" onClick={() => loadList(1)}>
          검색
        </button>
      </div>

      {pageResponse && pageResponse.dtoList.length === 0 && (
        <div className="empty-hint">등록된 글이 없습니다.</div>
      )}

      <div className="community-list">
        {pageResponse?.dtoList.map((post) => (
          <article
            key={post.postNo}
            className="card community-item"
            onClick={() => navigate(`/community/${post.postNo}`)}
          >
            <div className="title-row">
              <span className={`community-badge ${CATEGORY_BADGE_CLASS[post.category]}`}>
                {post.category}
              </span>
              <span className="title">{post.title}</span>
            </div>
            <span className="excerpt">
              {post.aiSummary ? `AI 한줄요약 · ${post.aiSummary}` : excerptOf(post.content)}
            </span>
            <span className="meta">
              {post.nickname} · 조회 {post.viewCount} · 댓글 {post.commentCount}
            </span>
          </article>
        ))}
      </div>

      {pageResponse && (
        <PageComponent serverData={pageResponse} movePage={movePage} />
      )}
    </div>
  );
};

export default CommunityListComponent;
