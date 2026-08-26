import BasicLayout from "../../layouts/BasicLayout";
import SkyBackground from "../../components/common/SkyBackground";
import WalkTrailMapComponent from "../../components/walk/WalkTrailMapComponent";

const WalkIndexPage = () => {
  return (
    <BasicLayout>
      <SkyBackground />
      <div className="page-sky-content">
        <div className="flex w-full flex-col gap-5 py-4">
          <h1 className="page-hero-title">AI 산책로 추천</h1>
          <WalkTrailMapComponent />
        </div>
      </div>
    </BasicLayout>
  );
};

export default WalkIndexPage;
