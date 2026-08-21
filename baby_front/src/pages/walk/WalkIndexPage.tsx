import BasicLayout from "../../layouts/BasicLayout";
import SkyBackground from "../../components/common/SkyBackground";
import WalkTrailMapComponent from "../../components/walk/WalkTrailMapComponent";

const WalkIndexPage = () => {
  return (
    <BasicLayout>
      <SkyBackground />
      <div className="page-sky-content">
        <WalkTrailMapComponent />
      </div>
    </BasicLayout>
  );
};

export default WalkIndexPage;
