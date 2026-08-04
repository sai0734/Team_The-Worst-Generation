import BasicLayout from "../layouts/BasicLayout";
import QuestPanel from "../components/quest/QuestPanel";

const MainPage = () => {
  return (
    <BasicLayout>
      <div className="text-3xl">Main Page</div>
      <QuestPanel />
    </BasicLayout>
  );
};

export default MainPage;
