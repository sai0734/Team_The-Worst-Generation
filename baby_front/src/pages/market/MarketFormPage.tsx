import BasicLayout from "../../layouts/BasicLayout";
import MarketFormComponent from "../../components/market/MarketFormComponent";
import SkyBackground from "../../components/common/SkyBackground";

const MarketFormPage = () => {
  return (
    <BasicLayout>
      <SkyBackground />
      <div className="page-sky-content">
        <MarketFormComponent />
      </div>
    </BasicLayout>
  );
};

export default MarketFormPage;
