import BasicLayout from "../../layouts/BasicLayout";
import SideMenuLayout from "../../layouts/SideMenuLayout";
import { LINKS } from "../../components/market/MarketSubNav";
import MarketFormComponent from "../../components/market/MarketFormComponent";
import SkyBackground from "../../components/common/SkyBackground";

const MarketFormPage = () => {
  return (
    <BasicLayout>
      <SkyBackground />
      <SideMenuLayout items={LINKS} className="page-sky-content">
        <MarketFormComponent />
      </SideMenuLayout>
    </BasicLayout>
  );
};

export default MarketFormPage;
