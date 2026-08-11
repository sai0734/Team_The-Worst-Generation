import BasicLayout from "../../layouts/BasicLayout";
import MarketSubNav from "../../components/market/MarketSubNav";
import MarketFormComponent from "../../components/market/MarketFormComponent";

const MarketFormPage = () => {
  return (
    <BasicLayout>
      <MarketSubNav />
      <MarketFormComponent />
    </BasicLayout>
  );
};

export default MarketFormPage;
