import { Outlet } from "react-router-dom";
import BasicLayout from "../../layouts/BasicLayout";
import SkyBackground from "../../components/common/SkyBackground";

const CommunityIndexPage = () => {
  return (
    <BasicLayout>
      <div className="home-page-inner">
        <SkyBackground />
        <section className="community-page">
          <Outlet />
        </section>
      </div>
    </BasicLayout>
  );
};

export default CommunityIndexPage;
