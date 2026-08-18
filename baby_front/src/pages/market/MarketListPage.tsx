import BasicLayout from "../../layouts/BasicLayout";
import MarketSubNav from "../../components/market/MarketSubNav";
import MarketHomeComponent from "../../components/market/MarketHomeComponent";

const MarketListPage = () => {
  return (
    <BasicLayout>
      <div>
        <MarketSubNav />
        <MarketHomeComponent />
      </div>
    </BasicLayout>
  );
};

export default MarketListPage;
