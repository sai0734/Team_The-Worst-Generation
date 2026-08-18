import { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import * as babysitterApi from "../../api/babysitterApi";

const PARENT_ONLY_PATHS = [
  "/community/babysitter",
  "/community/babysitter/my-picks",
  "/community/babysitter/requests/sent",
  "/community/babysitter/jobs/mine",
];
const SITTER_ONLY_PATHS = [
  "/community/babysitter/requests/received",
  "/community/babysitter/jobs/applications/mine",
];

const commonIconClass = ({ isActive }: { isActive: boolean }) =>
  `sitter-common-icon${isActive ? " active" : ""}`;

const subtabClass = ({ isActive }: { isActive: boolean }) =>
  `sitter-subtab${isActive ? " active" : ""}`;

const isJobBranch = (pathname: string) =>
  pathname.startsWith("/community/babysitter/jobs");

// 페이지 전체를 채우는 공통 화면(채팅, 내 프로필)에서는 갈래 카드/서브탭을 아예 숨긴다.
const isCommonRoute = (pathname: string) =>
  /^\/community\/babysitter\/(chat|me\/edit)(\/|$)/.test(pathname);

const BabysitterLayoutPage = () => {
  const { pathname } = useLocation();
  const onJobBranch = isJobBranch(pathname);
  const onCommon = isCommonRoute(pathname);

  // null = 아직 확인 전, true = 시터로 등록됨, false = 미등록(부모 입장)
  const [isSitter, setIsSitter] = useState<boolean | null>(null);

  useEffect(() => {
    babysitterApi
      .getMine()
      .then(() => setIsSitter(true))
      .catch(() => setIsSitter(false));
  }, []);

  // 역할과 안 맞는 화면(예: 시터가 뒤로가기로 "찜한 시터"에 남아있는 경우)에 머물러 있으면
  // 그 역할의 기본 화면으로 보내준다.
  if (isSitter === true && PARENT_ONLY_PATHS.includes(pathname)) {
    return <Navigate to="/community/babysitter/jobs" replace />;
  }
  if (isSitter === false && SITTER_ONLY_PATHS.includes(pathname)) {
    return <Navigate to="/community/babysitter" replace />;
  }

  return (
    <div>
      <div className="sitter-common-row">
        <NavLink to="/community/babysitter/chat" className={commonIconClass}>
          <span className="icon">💬</span>채팅
        </NavLink>
        <NavLink to="/community/babysitter/me/edit" className={commonIconClass}>
          <span className="icon">👤</span>내 프로필
        </NavLink>
      </div>

      {isSitter === false && !onCommon && (
        <>
          <div className="sitter-branch-row">
            <Link
              to="/community/babysitter"
              className={`sitter-branch-card${!onJobBranch ? " active" : ""}`}
            >
              <strong>시터 찾기 · 요청</strong>
              <span>마음에 드는 시터를 직접 찾아 요청해요</span>
            </Link>
            <Link
              to="/community/babysitter/jobs"
              className={`sitter-branch-card${onJobBranch ? " active" : ""}`}
            >
              <strong>구인글</strong>
              <span>필요한 조건을 올리고 시터의 지원을 받아요</span>
            </Link>
          </div>

          <div className="sitter-subtabs">
            {onJobBranch ? (
              <>
                <NavLink to="/community/babysitter/jobs" end className={subtabClass}>
                  구인글 목록
                </NavLink>
                <NavLink to="/community/babysitter/jobs/mine" className={subtabClass}>
                  내 글
                </NavLink>
                <NavLink to="/community/babysitter/jobs/write" className={subtabClass}>
                  구인글 작성
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/community/babysitter" end className={subtabClass}>
                  찾기
                </NavLink>
                <NavLink to="/community/babysitter/my-picks" className={subtabClass}>
                  찜한 시터
                </NavLink>
                <NavLink to="/community/babysitter/requests/sent" className={subtabClass}>
                  보낸 요청
                </NavLink>
              </>
            )}
          </div>
        </>
      )}

      {isSitter === true && !onCommon && (
        <div className="sitter-subtabs">
          <NavLink to="/community/babysitter/jobs" end className={subtabClass}>
            구인글 목록
          </NavLink>
          <NavLink to="/community/babysitter/jobs/applications/mine" className={subtabClass}>
            지원내역
          </NavLink>
          <NavLink to="/community/babysitter/requests/received" className={subtabClass}>
            받은 요청
          </NavLink>
        </div>
      )}

      <Outlet />
    </div>
  );
};

export default BabysitterLayoutPage;
