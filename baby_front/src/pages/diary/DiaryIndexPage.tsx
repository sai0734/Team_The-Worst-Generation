import { Outlet } from "react-router-dom";
import BasicLayout from "../../layouts/BasicLayout";
import SideMenuLayout from "../../layouts/SideMenuLayout";

const DIARY_SIDE_ITEMS = [
  { label: "육아일기", to: "/diary" },
  { label: "앨범&인화", to: "/diary/album" },
];

const DiaryIndexPage = () => {
  return (
    <BasicLayout>
      <SideMenuLayout items={DIARY_SIDE_ITEMS}>
        <Outlet />
      </SideMenuLayout>
    </BasicLayout>
  );
};

export default DiaryIndexPage;
