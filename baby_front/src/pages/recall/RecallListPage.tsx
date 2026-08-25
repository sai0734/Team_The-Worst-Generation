import BasicLayout from "../../layouts/BasicLayout";
import SkyBackground from "../../components/common/SkyBackground";
import RecallListComponent from "../../components/recall/RecallListComponent";

const RecallListPage = () => {
  return (
    <BasicLayout>
      <SkyBackground />
      <div className="page-sky-content">
        <RecallListComponent />
      </div>
    </BasicLayout>
  );
};

export default RecallListPage;
