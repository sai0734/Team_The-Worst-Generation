import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as communityApi from "../../api/communityApi";
import { CATEGORY_BADGE_CLASS, COMMUNITY_CATEGORIES } from "../../api/communityApi";
import type { CommunityCategory, CommunityPost } from "../../api/communityApi";
import type { PageResponse } from "../../types/page";
import type { MovePageParam } from "../../hooks/useCustomMove";
import PageComponent from "../common/PageComponent";
import useCustomLogin from "../../hooks/useCustomLogin";

const EXCERPT_MAX_LENGTH = 60;

const excerptOf = (content: string): string =>
  content.length > EXCERPT_MAX_LENGTH
    ? `${content.slice(0, EXCERPT_MAX_LENGTH)}…`
    : content;

const formatDateTime = (iso: string): string => iso.slice(0, 16).replace("T", " ");

const CommunityListComponent = () => {
  const navigate = useNavigate();
  const { isLogin } = useCustomLogin();

  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<CommunityCategory | "ALL">("ALL");
  const [pageResponse, setPageResponse] =
    useState<PageResponse<CommunityPost> | null>(null);

  const loadList = async (pageNum: number, categoryOverride?: CommunityCategory | "ALL") => {
    const activeCategory = categoryOverride ?? category;

    const res = await communityApi.getList({
      page: pageNum,
      size: 10,
      keyword: keyword || undefined,
      category: activeCategory === "ALL" ? undefined : activeCategory,
    });

    setPageResponse(res);
  };

  const handleCategoryClick = (cat: CommunityCategory | "ALL") => {
    setCategory(cat);
    loadList(1, cat);
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
        <h2 className="page-hero-title">이웃 부모들과 나누는 이야기</h2>
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

      <div className="seg" style={{ marginBottom: 12 }}>
        <button
          type="button"
          className={category === "ALL" ? "is-active" : ""}
          onClick={() => handleCategoryClick("ALL")}
        >
          전체
        </button>
        {COMMUNITY_CATEGORIES.map((c) => (
          <button
            type="button"
            key={c}
            className={category === c ? "is-active" : ""}
            onClick={() => handleCategoryClick(c)}
          >
            {c}
          </button>
        ))}
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
              {post.nickname} · {formatDateTime(post.regTime)} · 조회 {post.viewCount} · 공감 {post.likeCount} · 댓글{" "}
              {post.commentCount}
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
