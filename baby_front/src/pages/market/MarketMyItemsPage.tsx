import BasicLayout from "../../layouts/BasicLayout";
import SideMenuLayout from "../../layouts/SideMenuLayout";
import { LINKS } from "../../components/market/MarketSubNav";
import MarketMyItemsComponent from "../../components/market/MarketMyItemsComponent";
import SkyBackground from "../../components/common/SkyBackground";

const MarketMyItemsPage = () => {
  return (
    <BasicLayout>
      <SkyBackground />
      <SideMenuLayout items={LINKS} className="page-sky-content">
        <MarketMyItemsComponent />
      </SideMenuLayout>
    </BasicLayout>
  );
};

export default MarketMyItemsPage;
