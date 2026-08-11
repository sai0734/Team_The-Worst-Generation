import BasicLayout from "../../layouts/BasicLayout";
import MarketSubNav from "../../components/market/MarketSubNav";
import MarketDetailComponent from "../../components/market/MarketDetailComponent";

const MarketDetailPage = () => {
  return (
    <BasicLayout>
      <MarketSubNav />
      <MarketDetailComponent />
    </BasicLayout>
  );
};

export default MarketDetailPage;
