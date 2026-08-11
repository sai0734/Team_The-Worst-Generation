import BasicLayout from "../../layouts/BasicLayout";
import MarketSubNav from "../../components/market/MarketSubNav";
import MarketMyComponent from "../../components/market/MarketMyComponent";

// 마켓 내부 마이페이지
const MarketMyPage = () => {
  return (
    <BasicLayout>
      <MarketSubNav />
      <MarketMyComponent />
    </BasicLayout>
  );
};

export default MarketMyPage;
