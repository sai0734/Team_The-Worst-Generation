import BasicLayout from "../../layouts/BasicLayout";
import MarketProfileComponent from "../../components/market/MarketProfileComponent";
import SkyBackground from "../../components/common/SkyBackground";

// 다른 판매자 프로필 보기
const MarketProfilePage = () => {
  return (
    <BasicLayout>
      <SkyBackground />
      <div className="page-sky-content">
        <MarketProfileComponent />
      </div>
    </BasicLayout>
  );
};

export default MarketProfilePage;
