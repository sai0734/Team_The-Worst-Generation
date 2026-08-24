import { useEffect, useState } from "react";

const STEPS = [
  "새하얀 이야기 세계를 펼치는 중...",
  "주인공이 걸어갈 첫 번째 길을 만드는 중...",
  "반짝이는 상상력 가루를 살짝 뿌리는 중...",
  "말하는 동물 친구를 깨우는 중...",
  "구름 뒤에 작은 모험을 숨기는 중...",
  "주인공의 가방에 용기를 챙겨 넣는 중...",
  "길을 잃은 별 하나를 제자리로 돌려보내는 중...",
  "너무 무서운 괴물을 순한 구름으로 바꾸는 중...",
  "친구들에게 재미있는 대사를 알려주는 중...",
  "숲속 나무들에게 비밀을 부탁하는 중...",
  "이야기의 끝에 포근한 이불을 덮는 중...",
];

interface StoryLoadingProps { babyName: string; completed: boolean; onFinish: () => void; }

const StoryLoading = ({ babyName, completed, onFinish }: StoryLoadingProps) => {
  const [step, setStep] = useState(0);
  const canFinish = completed && step >= 3;

  useEffect(() => {
    if (canFinish) {
      const timer = window.setTimeout(onFinish, 1100);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setStep((current) => (current + 1) % STEPS.length), 1800);
    return () => window.clearTimeout(timer);
  }, [canFinish, onFinish, step]);

  const progress = canFinish ? 100 : Math.min(16 + step * 8, 88);
  return (
    <section className="story-loading card" aria-live="polite" aria-busy={!canFinish}>
      <span className="story-kicker">MAKING A LITTLE WORLD</span>
      <div className="story-book-stage">
        <span className="story-spark spark-one">✦</span><span className="story-spark spark-two">✧</span>
        <img src="/story-fantasy-book.png" alt="마법책에서 이야기가 피어나는 모습" />
      </div>
      <h1>{babyName}의 동화 세계를 만들고 있어요</h1>
      <p className="story-loading-message" key={canFinish ? "done" : step}>
        {canFinish ? "마지막 별빛을 표지에 붙였어요!" : STEPS[step]}
      </p>
      <div className="story-progress" aria-label={`동화 생성 연출 ${progress}%`}><span style={{ width: `${progress}%` }} /></div>
      <small>책장이 완성될 때까지 잠시만 기다려 주세요.</small>
    </section>
  );
};

export default StoryLoading;
