import BasicLayout from "../../layouts/BasicLayout";
import MarketSubNav from "../../components/market/MarketSubNav";
import MarketWishComponent from "../../components/market/MarketWishComponent";

const MarketWishPage = () => {
  return (
    <BasicLayout>
      <div>
        <MarketSubNav />
        <MarketWishComponent />
      </div>
    </BasicLayout>
  );
};

export default MarketWishPage;
