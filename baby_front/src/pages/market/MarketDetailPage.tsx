import BasicLayout from "../../layouts/BasicLayout";
import MarketDetailComponent from "../../components/market/MarketDetailComponent";
import SkyBackground from "../../components/common/SkyBackground";

const MarketDetailPage = () => {
  return (
    <BasicLayout>
      <SkyBackground />
      <div className="page-sky-content">
        <MarketDetailComponent />
      </div>
    </BasicLayout>
  );
};

export default MarketDetailPage;
