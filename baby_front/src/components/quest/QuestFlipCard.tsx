import type { MemberQuest } from "../../api/questApi";
import "./QuestFlipCard.css";

type FlipVariant = "daily" | "urgent";

interface QuestFlipCardProps {
  variant: FlipVariant;
  flipped: boolean;
  quests: MemberQuest[];
  busy?: boolean;
  frontLabel: string;
  frontHint: string;
  finishLabel?: string;
  onFlip: () => void;
  onToggle: (id: number, shouldComplete: boolean) => void;
  onFinishAll?: () => void;
}

const QuestFlipCard = ({
  variant,
  flipped,
  quests,
  busy,
  frontLabel,
  frontHint,
  finishLabel = "일일 퀘스트 완료",
  onFlip,
  onToggle,
  onFinishAll,
}: QuestFlipCardProps) => {
  const allDone =
    quests.length > 0 && quests.every((q) => q.status === "DONE");

  return (
    <div
      className={`quest-flip quest-flip--${variant} ${flipped ? "is-flipped" : ""}`}
    >
      <div className="quest-flip-inner">
        <button
          type="button"
          className="quest-flip-face quest-flip-front"
          onClick={() => {
            if (!flipped && !busy) onFlip();
          }}
          disabled={flipped || busy}
        >
          <span className="mb-2 text-xs font-bold uppercase tracking-wide opacity-80">
            {variant === "urgent" ? "URGENT" : "DAILY"}
          </span>
          <span className="text-lg font-extrabold leading-snug">{frontLabel}</span>
          <span className="mt-2 text-xs opacity-70">{frontHint}</span>
        </button>

        <div className="quest-flip-face quest-flip-back">
          {quests.length === 0 ? (
            <p className="text-sm">퀘스트 없음</p>
          ) : (
            <>
              <ul className="quest-flip-list">
                {quests.map((q) => {
                  const done = q.status === "DONE";
                  return (
                    <li key={q.id} className="quest-flip-item">
                      <label className="quest-check-row">
                        <input
                          type="checkbox"
                          className="quest-check"
                          checked={done}
                          disabled={busy}
                          onChange={() => onToggle(q.id, !done)}
                        />
                        <span className="quest-check-text">
                          <span
                            className={`quest-check-title ${done ? "is-done" : ""}`}
                          >
                            {q.quest?.title ?? "퀘스트"}
                          </span>
                          <span className="quest-check-meta">
                            보상 {q.quest?.reward ?? 0}P
                            {done ? " · 완료" : ""}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>

              {allDone && onFinishAll && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onFinishAll}
                  className="mt-3 w-full rounded-lg bg-white px-2 py-2 text-sm font-bold text-gray-900 disabled:opacity-60"
                >
                  {finishLabel}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestFlipCard;
