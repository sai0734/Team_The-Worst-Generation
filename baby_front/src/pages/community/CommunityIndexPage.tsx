import { NavLink, Outlet } from "react-router-dom";
import BasicLayout from "../../layouts/BasicLayout";
import SkyBackground from "../../components/common/SkyBackground";

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `community-tab${isActive ? " active" : ""}`;

const CommunityIndexPage = () => {
  return (
    <BasicLayout>
      <div className="home-page-inner">
        <SkyBackground />
        <section className="community-page">
          <div className="page-header-card">
            <h1 className="page-title">커뮤니티</h1>
            <nav className="community-tabs">
              <NavLink to="/community" end className={tabClass}>
                자유게시판
              </NavLink>
              <NavLink to="/community/babysitter" className={tabClass}>
                베이비시터
              </NavLink>
            </nav>
          </div>

          <Outlet />
        </section>
      </div>
    </BasicLayout>
  );
};

export default CommunityIndexPage;
