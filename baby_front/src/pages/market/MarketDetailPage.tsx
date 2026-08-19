import BasicLayout from "../../layouts/BasicLayout";
import MarketSubNav from "../../components/market/MarketSubNav";
import MarketDetailComponent from "../../components/market/MarketDetailComponent";
import SkyBackground from "../../components/common/SkyBackground";

const MarketDetailPage = () => {
  return (
    <BasicLayout>
      <SkyBackground />
      <div className="page-sky-content">
        <MarketSubNav />
        <MarketDetailComponent />
      </div>
    </BasicLayout>
  );
};

export default MarketDetailPage;
