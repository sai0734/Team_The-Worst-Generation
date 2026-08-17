import BasicLayout from "../../layouts/BasicLayout";
import MarketSubNav from "../../components/market/MarketSubNav";
import MarketMyItemsComponent from "../../components/market/MarketMyItemsComponent";

const MarketMyItemsPage = () => {
  return (
    <BasicLayout>
      <div>
        <MarketSubNav />
        <MarketMyItemsComponent />
      </div>
    </BasicLayout>
  );
};

export default MarketMyItemsPage;
