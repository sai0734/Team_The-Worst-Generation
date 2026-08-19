import { Outlet } from "react-router-dom";
import BasicLayout from "../../layouts/BasicLayout";
import SideMenuLayout from "../../layouts/SideMenuLayout";
import SkyBackground from "../../components/common/SkyBackground";

const AI_SIDE_ITEMS = [
  { label: "울음소리 분석", to: "/ai/cry-check" },
  { label: "맞춤 동화 생성", to: "/ai/story" },
  { label: "맞춤 산책로", to: "/walk" },
  { label: "이유식 레시피", to: "/ai/recipe" },
];

const AiIndexPage = () => {
  return (
    <BasicLayout>
      <SkyBackground />
      <SideMenuLayout items={AI_SIDE_ITEMS} className="page-sky-content">
        <Outlet />
      </SideMenuLayout>
    </BasicLayout>
  );
};

export default AiIndexPage;
