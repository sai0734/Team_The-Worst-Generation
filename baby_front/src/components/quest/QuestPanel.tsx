import { useEffect, useState } from "react";
import {
  questApi,
  type MemberQuest,
  type QuestHome,
} from "../../api/questApi";
import QuestFlipCard from "./QuestFlipCard";

const emptyHome: QuestHome = {
  dailyQuests: [],
  urgentQuests: [],
  point: 0,
};

type SlotState = {
  flipped: boolean;
  questIds: number[];
};

const QuestPanel = () => {
  const [home, setHome] = useState<QuestHome>(emptyHome);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [dailySlot, setDailySlot] = useState<SlotState>({
    flipped: false,
    questIds: [],
  });
  const [urgentFlip, setUrgentFlip] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await questApi.getHome();
      setHome({
        dailyQuests: data.dailyQuests ?? [],
        urgentQuests: data.urgentQuests ?? [],
        point: data.point ?? 0,
      });
    } catch (e) {
      console.error("quest home load failed", e);
      setHome(emptyHome);
      alert(
        "퀘스트를 불러오지 못했습니다. 로그인 상태와 백엔드 실행 여부를 확인하세요.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pickDailyThree = (list: MemberQuest[]) => {
    const todo = list.filter((q) => q.status !== "DONE");
    const done = list.filter((q) => q.status === "DONE");
    return [...todo, ...done].slice(0, 3);
  };

  const handleDailyFlip = async () => {
    try {
      const data = await questApi.getHome();
      const list = data.dailyQuests ?? [];
      setHome({
        dailyQuests: list,
        urgentQuests: data.urgentQuests ?? [],
        point: data.point ?? 0,
      });

      const picked = pickDailyThree(list);
      if (picked.length === 0) {
        alert("배정 가능한 일일 퀘스트가 없습니다.");
        return;
      }

      setDailySlot({
        flipped: true,
        questIds: picked.map((q) => q.id),
      });
    } catch (e) {
      console.error("daily flip failed", e);
      alert("퀘스트 생성에 실패했습니다. 로그인/서버를 확인하세요.");
    }
  };

  const handleToggle = async (id: number, shouldComplete: boolean) => {
    setBusyId(id);
    try {
      if (shouldComplete) {
        await questApi.complete(id);
      } else {
        await questApi.uncomplete(id);
      }
      await load();
    } catch (e) {
      console.error("quest toggle failed", e);
      alert(
        shouldComplete
          ? "퀘스트 완료에 실패했습니다."
          : "퀘스트 취소에 실패했습니다. 백엔드 uncomplete API를 확인하세요.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleFinishDaily = () => {
    setDailySlot({ flipped: false, questIds: [] });
  };

  const dailyQuests = dailySlot.questIds
    .map((id) => home.dailyQuests.find((q) => q.id === id))
    .filter((q): q is MemberQuest => q != null);

  const urgentQuest = home.urgentQuests[0] ?? null;

  if (loading) {
    return <div className="p-4 text-sm text-gray-600">로딩 중...</div>;
  }

  return (
    <div className="flex flex-wrap items-start justify-center gap-6">
      <QuestFlipCard
        variant="daily"
        flipped={dailySlot.flipped}
        quests={dailyQuests}
        busy={busyId != null && dailySlot.questIds.includes(busyId)}
        frontLabel="일일 퀘스트"
        frontHint="탭해서 체크리스트 받기"
        finishLabel="일일 퀘스트 완료"
        onFlip={handleDailyFlip}
        onToggle={handleToggle}
        onFinishAll={handleFinishDaily}
      />

      {urgentQuest ? (
        <QuestFlipCard
          variant="urgent"
          flipped={urgentFlip || urgentQuest.status === "DONE"}
          quests={[urgentQuest]}
          busy={busyId === urgentQuest.id}
          frontLabel="긴급 퀘스트"
          frontHint="탭하면 체크리스트로 공개"
          finishLabel="긴급 퀘스트 완료"
          onFlip={() => setUrgentFlip(true)}
          onToggle={handleToggle}
          onFinishAll={() => setUrgentFlip(false)}
        />
      ) : (
        <QuestFlipCard
          variant="urgent"
          flipped={false}
          quests={[]}
          frontLabel="긴급 퀘스트"
          frontHint="배우자가 보내면 여기에 표시"
          onFlip={() => alert("아직 배우자가 보낸 긴급 미션이 없습니다.")}
          onToggle={() => {}}
        />
      )}
    </div>
  );
};

export default QuestPanel;
