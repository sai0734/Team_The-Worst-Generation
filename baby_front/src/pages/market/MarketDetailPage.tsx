import BasicLayout from "../../layouts/BasicLayout";
import MarketSubNav from "../../components/market/MarketSubNav";
import MarketDetailComponent from "../../components/market/MarketDetailComponent";

const MarketDetailPage = () => {
  return (
    <BasicLayout>
      <div>
        <MarketSubNav />
        <MarketDetailComponent />
      </div>
    </BasicLayout>
  );
};

export default MarketDetailPage;
