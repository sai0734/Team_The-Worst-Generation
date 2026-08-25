import BasicLayout from "../../layouts/BasicLayout";
import MarketHomeComponent from "../../components/market/MarketHomeComponent";
import SkyBackground from "../../components/common/SkyBackground";

const MarketListPage = () => {
  return (
    <BasicLayout>
      <SkyBackground />
      <div className="page-sky-content">
        <MarketHomeComponent />
      </div>
    </BasicLayout>
  );
};

export default MarketListPage;
