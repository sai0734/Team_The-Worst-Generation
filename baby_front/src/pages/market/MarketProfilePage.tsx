import BasicLayout from "../../layouts/BasicLayout";
import MarketSubNav from "../../components/market/MarketSubNav";
import MarketProfileComponent from "../../components/market/MarketProfileComponent";

// 다른 판매자 프로필 보기
const MarketProfilePage = () => {
  return (
    <BasicLayout>
      <div>
        <MarketSubNav />
        <MarketProfileComponent />
      </div>
    </BasicLayout>
  );
};

export default MarketProfilePage;
