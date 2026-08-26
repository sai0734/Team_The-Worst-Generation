import { useSelector } from "react-redux";
import { FormEvent, useState } from "react";
import type { RootState } from "../../store";
import * as behaviorApi from "../../api/behaviorApi";
import { BehaviorConsult } from "../../api/behaviorApi";

interface BehaviorInputProps {
  onCreated: (consult: BehaviorConsult) => void;
}

const CATEGORIES = [
  { label: "편식", icon: "🍎" },
  { label: "떼쓰기", icon: "😢" },
  { label: "손톱 물기", icon: "🤚" },
  { label: "형제 다툼", icon: "⚔️" },
  { label: "낯가림", icon: "🙈" },
  { label: "거짓말", icon: "💬" },
];

const BehaviorInputComponent = ({ onCreated }: BehaviorInputProps) => {
  const currentBaby = useSelector(
    (state: RootState) => state.babySlice.currentBaby,
  );

  const [category, setCategory] = useState("");
  const [situation, setSituation] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!currentBaby?.babyNo) {
      alert("선택된 아이가 없습니다.");
      return;
    }
    if (!category || !situation.trim()) {
      alert("카테고리와 상황을 모두 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const consult = await behaviorApi.createConsult(
        currentBaby.babyNo,
        category,
        situation.trim(),
      );
      setCategory("");
      setSituation("");
      onCreated(consult);
    } catch (err) {
      alert("AI 상담 생성에 실패했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-[24px] border border-[rgba(42,41,38,0.1)] bg-[#FAF6F0] p-4 sm:p-6"
    >
      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold text-[#2A2926]">
          어떤 행동이 고민이세요?
        </p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              type="button"
              onClick={() => setCategory(cat.label)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 transition-colors ${
                category === cat.label
                  ? "border-[#5AB2FF] bg-[#EAF6FF]"
                  : "border-[rgba(42,41,38,0.12)] bg-white"
              }`}
            >
              <span className="text-base">{cat.icon}</span>
              <span className="text-xs font-bold text-[#2A2926]">
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <textarea
          className="min-h-[52px] flex-1 resize-none rounded-[16px] border border-[rgba(42,41,38,0.12)] bg-white p-3.5 text-sm text-[#2A2926] outline-none transition-colors focus:border-[#5AB2FF]"
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
          placeholder="상황을 좀 더 자세히 알려주세요"
          rows={2}
        />

        <button
          type="submit"
          disabled={loading}
          className="flex flex-shrink-0 items-center justify-center gap-2 rounded-full bg-[#2A2926] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#453f38] disabled:cursor-not-allowed disabled:bg-[#CBD5E1]"
        >
          {loading && (
            <span className="h-3.5 w-3.5 flex-shrink-0 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {loading ? "답변 준비 중..." : "AI에게 물어보기"}
        </button>
      </div>
    </form>
  );
};

export default BehaviorInputComponent;
