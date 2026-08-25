import ModifyComponent from "../../components/member/ModifyComponent";
import BasicLayout from "../../layouts/BasicLayout";
import SkyBackground from "../../components/common/SkyBackground";

const ModfyPage = () => {
  return (
    <BasicLayout>
      <SkyBackground />
      <div className="page-sky-content">
        <div className=" text-3xl">Member Modify Page</div>

        <div className="bg-white w-full mt-4 p-2">
          <ModifyComponent></ModifyComponent>
        </div>
      </div>
    </BasicLayout>
  );
};

export default ModfyPage;
