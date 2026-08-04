import { useEffect, useState } from "react";
import { completeQuest, getTodayQuests } from "../../api/questApi";
import type { MemberQuest, QuestType } from "../../types/quest";

const QuestPanel = () => {
  const [quests, setQuests] = useState<MemberQuest[]>([]);
  const [loading, setLoading] = useState(true);
//목록 불러오기
  const load = async () => {
    setLoading(true);
    try {
      const data = await getTodayQuests();
      setQuests(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);
//목록불러오기 끝
  const handleComplete = async (id: number) => {
    await completeQuest(id);
    await load();
  };

  const renderList = (type: QuestType, title: string) => {
    const list = quests.filter((q) => q.type === type);

    return (
      <div className="w-full p-4">
        <h2 className="text-xl font-bold mb-3">{title}</h2>

        {list.length === 0 ? (
          <p className="text-gray-500">오늘 배정된 퀘스트가 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {list.map((q) => (
              <li
                key={q.id}
                className="flex items-center justify-between border rounded p-3"
              >
                <div>
                  <div className="font-semibold">{q.title}</div>
                  {q.description && (
                    <div className="text-sm text-gray-600">{q.description}</div>
                  )}
                  {typeof q.reward === "number" && (
                    <div className="text-sm">보상: {q.reward}P</div>
                  )}
                </div>

                {q.status === "DONE" ? (
                  <span className="text-green-600 font-medium">완료</span>
                ) : (
                  <button
                    type="button"
                    className="px-3 py-1 bg-blue-500 text-white rounded"
                    onClick={() => handleComplete(q.id)}
                  >
                    완료
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="p-4">로딩 중...</div>;
  }

  return (
    <div className="w-full">
      {renderList("DAILY", "일일 퀘스트")}
      {renderList("URGENT", "긴급 퀘스트")}
    </div>
  );
};

export default QuestPanel;
