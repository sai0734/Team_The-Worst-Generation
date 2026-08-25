import BasicLayout from "../../layouts/BasicLayout";
import MarketMyItemsComponent from "../../components/market/MarketMyItemsComponent";
import SkyBackground from "../../components/common/SkyBackground";

const MarketMyItemsPage = () => {
  return (
    <BasicLayout>
      <SkyBackground />
      <div className="page-sky-content">
        <MarketMyItemsComponent />
      </div>
    </BasicLayout>
  );
};

export default MarketMyItemsPage;
