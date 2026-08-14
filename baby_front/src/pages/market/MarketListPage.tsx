import BasicLayout from "../../layouts/BasicLayout";
import MarketSubNav from "../../components/market/MarketSubNav";
import MarketListComponent from "../../components/market/MarketListComponent";

const MarketListPage = () => {
  return (
    <BasicLayout>
      <div>
        <MarketSubNav />
        <MarketListComponent />
      </div>
    </BasicLayout>
  );
};

export default MarketListPage;
