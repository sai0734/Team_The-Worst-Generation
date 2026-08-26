import { Outlet } from "react-router-dom";
import BasicLayout from "../../layouts/BasicLayout";
import SkyBackground from "../../components/common/SkyBackground";

const AiIndexPage = () => {
  return (
    <BasicLayout>
      <div className="home-page-inner">
        <SkyBackground />
        <div className="page-sky-content">
          <Outlet />
        </div>
      </div>
    </BasicLayout>
  );
};

export default AiIndexPage;
