import { Outlet } from "react-router-dom";
import BasicLayout from "../../layouts/BasicLayout";
import SkyBackground from "../../components/common/SkyBackground";

const DiaryIndexPage = () => {
  return (
    <BasicLayout>
      <SkyBackground />
      <div className="page-sky-content">
        <Outlet />
      </div>
    </BasicLayout>
  );
};

export default DiaryIndexPage;
