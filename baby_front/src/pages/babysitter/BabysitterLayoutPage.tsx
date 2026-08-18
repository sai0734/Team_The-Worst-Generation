import { NavLink, Outlet } from "react-router-dom";

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `sitter-tab-chip${isActive ? " active" : ""}`;

const BabysitterLayoutPage = () => {
  return (
    <div>
      <div className="sitter-tab-groups">
        <div className="sitter-tab-group">
          <span className="sitter-tab-group-label">공통</span>
          <div className="sitter-tab-group-tabs">
            <NavLink to="/community/babysitter/chat" className={tabClass}>
              채팅목록
            </NavLink>
          </div>
        </div>

        <div className="sitter-tab-group">
          <span className="sitter-tab-group-label">부모로서</span>
          <div className="sitter-tab-group-tabs">
            <NavLink to="/community/babysitter" end className={tabClass}>
              베이비시터 찾기
            </NavLink>
            <NavLink to="/community/babysitter/jobs" className={tabClass}>
              구인글 게시판
            </NavLink>
            <NavLink to="/community/babysitter/my-picks" className={tabClass}>
              내가 찜한 시터
            </NavLink>
            <NavLink to="/community/babysitter/requests/sent" className={tabClass}>
              내가 보낸 요청
            </NavLink>
          </div>
        </div>

        <div className="sitter-tab-group">
          <span className="sitter-tab-group-label">시터로서</span>
          <div className="sitter-tab-group-tabs">
            <NavLink to="/community/babysitter/requests/received" className={tabClass}>
              나에게 온 요청
            </NavLink>
            <NavLink to="/community/babysitter/me/edit" className={tabClass}>
              내 프로필
            </NavLink>
          </div>
        </div>
      </div>

      <Outlet />
    </div>
  );
};

export default BabysitterLayoutPage;
