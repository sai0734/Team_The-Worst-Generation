import BasicLayout from "../../layouts/BasicLayout";
import MarketSubNav from "../../components/market/MarketSubNav";
import MarketMapComponent from "../../components/market/MarketMapComponent";

const MarketMapPage = () => {
  return (
    <BasicLayout>
      <div>
        <MarketSubNav />
        <MarketMapComponent />
      </div>
    </BasicLayout>
  );
};

export default MarketMapPage;
