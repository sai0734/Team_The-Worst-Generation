import BasicLayout from "../layouts/BasicLayout";
import QuestPanel from "../components/quest/QuestPanel";
import AssistantPanel from "../components/assistant/AssistantPanel";

const MainPage = () => {
  return (
    <BasicLayout>
      <div className="mb-8">
        <AssistantPanel />
      </div>
      <div className="mb-4 text-2xl font-bold text-gray-900">오늘의 퀘스트</div>
      <QuestPanel />
    </BasicLayout>
  );
};

export default MainPage;
