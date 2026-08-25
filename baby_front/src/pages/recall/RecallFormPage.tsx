import BasicLayout from "../../layouts/BasicLayout";
import SkyBackground from "../../components/common/SkyBackground";
import RecallFormComponent from "../../components/recall/RecallFormComponent";

const RecallFormPage = () => {
  return (
    <BasicLayout>
      <SkyBackground />
      <div className="page-sky-content">
        <RecallFormComponent />
      </div>
    </BasicLayout>
  );
};

export default RecallFormPage;
