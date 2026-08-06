import { useEffect, useState } from "react";
import { completeQuest, getQuestHome } from "../../api/questApi";
import type { MemberQuest, QuestHome, QuestType } from "../../types/quest";

const emptyHome: QuestHome = {
  dailyQuests: [],
  weeklyQuests: [],
  eventQuests: [],
  urgentQuests: [],
  point: 0,
};

const typeStyle: Record<
  QuestType,
  { badge: string; badgeText: string; border: string; btn: string }
> = {
  URGENT: {
    badge: "bg-red-500",
    badgeText: "긴급",
    border: "border-red-200",
    btn: "bg-red-500 hover:bg-red-600",
  },
  DAILY: {
    badge: "bg-sky-500",
    badgeText: "일일",
    border: "border-sky-200",
    btn: "bg-sky-500 hover:bg-sky-600",
  },
  WEEKLY: {
    badge: "bg-emerald-500",
    badgeText: "주간",
    border: "border-emerald-200",
    btn: "bg-emerald-500 hover:bg-emerald-600",
  },
  EVENT: {
    badge: "bg-amber-500",
    badgeText: "이벤트",
    border: "border-amber-200",
    btn: "bg-amber-500 hover:bg-amber-600",
  },
};

const QuestPanel = () => {
  const [home, setHome] = useState<QuestHome>(emptyHome);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getQuestHome();
      setHome({
        dailyQuests: data.dailyQuests ?? [],
        weeklyQuests: data.weeklyQuests ?? [],
        eventQuests: data.eventQuests ?? [],
        urgentQuests: data.urgentQuests ?? [],
        point: data.point ?? 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleComplete = async (id: number) => {
    setCompletingId(id);
    try {
      await completeQuest(id);
      await load();
    } finally {
      setCompletingId(null);
    }
  };

  const allQuests = [
    ...home.urgentQuests,
    ...home.dailyQuests,
    ...home.weeklyQuests,
    ...home.eventQuests,
  ];
  const doneCount = allQuests.filter((q) => q.status === "DONE").length;
  const totalCount = allQuests.length;
  const earnedPoint = allQuests
    .filter((q) => q.status === "DONE")
    .reduce((sum, q) => sum + (q.quest?.reward ?? 0), 0);

  const renderCard = (mq: MemberQuest) => {
    const type = (mq.quest?.type ?? "DAILY") as QuestType;
    const style = typeStyle[type] ?? typeStyle.DAILY;
    const isDone = mq.status === "DONE";
    const title = mq.quest?.title ?? "제목 없음";
    const description = mq.quest?.description;
    const reward = mq.quest?.reward ?? 0;

    return (
      <article
        key={mq.id}
        className={`flex flex-col rounded-xl border bg-white p-4 shadow-md transition ${
          style.border
        } ${isDone ? "opacity-65" : "hover:-translate-y-0.5 hover:shadow-lg"}`}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <span
            className={`rounded px-2 py-0.5 text-xs font-semibold text-white ${style.badge}`}
          >
            {style.badgeText}
          </span>
          {isDone && (
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
              완료
            </span>
          )}
        </div>

        <h3 className="mb-1 text-lg font-bold text-gray-900">{title}</h3>

        {description && (
          <p className="mb-3 line-clamp-2 flex-1 text-sm text-gray-600">
            {description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <span className="text-sm text-gray-500">
            보상{" "}
            <span className="font-semibold text-gray-800">{reward}P</span>
          </span>

          {!isDone && (
            <button
              type="button"
              disabled={completingId === mq.id}
              onClick={() => handleComplete(mq.id)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:opacity-60 ${style.btn}`}
            >
              {completingId === mq.id ? "처리 중..." : "완료"}
            </button>
          )}
        </div>
      </article>
    );
  };

  const renderSection = (title: string, list: MemberQuest[]) => (
    <section className="w-full">
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <span className="text-sm text-gray-600">
          {list.filter((q) => q.status === "DONE").length}/{list.length}
        </span>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white/70 p-6 text-center text-sm text-gray-500">
          배정된 퀘스트가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map(renderCard)}
        </div>
      )}
    </section>
  );

  if (loading) {
    return <div className="p-4 text-gray-700">로딩 중...</div>;
  }

  return (
    <div className="w-full space-y-6">
      <div className="rounded-xl border border-white/60 bg-white px-4 py-3 text-sm text-gray-700 shadow-md">
        오늘 진행{" "}
        <span className="font-bold">
          {doneCount}/{totalCount}
        </span>
        {" · "}
        획득 포인트 <span className="font-bold">{earnedPoint}P</span>
        {" · "}
        보유 <span className="font-bold">{home.point}P</span>
      </div>

      {renderSection("긴급 퀘스트", home.urgentQuests)}
      {renderSection("일일 퀘스트", home.dailyQuests)}
      {renderSection("주간 퀘스트", home.weeklyQuests)}
      {renderSection("이벤트 퀘스트", home.eventQuests)}
    </div>
  );
};

export default QuestPanel;
