import { useState } from "react";
import {
  assistantApi,
  type AssistCategory,
  type AssistItem,
} from "../../api/assistantApi";

const CATEGORIES: { key: AssistCategory; label: string }[] = [
  { key: "CHILDCARE", label: "어린이집" },
  { key: "SUBSIDY", label: "정부지원금" },
  { key: "WELFARE", label: "지역복지" },
  { key: "CARE", label: "아이돌봄" },
  { key: "VACCINATION", label: "예방접종" },
  { key: "FACILITY", label: "육아시설" },
];

interface AssistantPanelProps {
  className?: string;
}

/** AI 정부지원금 — 기존 AI 육아 비서 기능을 이 패널로 이전 */
const AssistantPanel = ({ className }: AssistantPanelProps) => {
  const [query, setQuery] = useState("");
  const [months, setMonths] = useState("");
  const [sido, setSido] = useState("서울");
  const [sigungu, setSigungu] = useState("");
  const [selected, setSelected] = useState<AssistCategory[]>([
    "SUBSIDY",
    "WELFARE",
  ]);
  const [answer, setAnswer] = useState("");
  const [items, setItems] = useState<AssistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const toggle = (key: AssistCategory) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const run = async () => {
    if (!query.trim() || selected.length === 0 || loading) return;
    setLoading(true);
    try {
      const res = await assistantApi.recommend({
        query: query.trim(),
        categories: selected,
        child: {
          babyMonths: months ? Number(months) : undefined,
          regionSido: sido || undefined,
          regionSigungu: sigungu || undefined,
        },
      });
      setAnswer(res.answer);
      setItems(res.items ?? []);
    } catch (e) {
      console.error(e);
      alert("정부지원금 조회에 실패했습니다. 로그인·서버 상태를 확인하세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <article
      id="ai-subsidy-panel"
      className={`card info supportbox support-panel${className ? ` ${className}` : ""}`}
    >
      <small>AI 정부지원금</small>
      <strong style={{ marginBottom: 1 }}>맞춤 육아·복지 혜택 찾기</strong>
      <p style={{ marginBottom: 2, fontSize: 10.5 }}>
        아이 개월수·지역을 넣고 질문하면 지원금·복지·돌봄 정보를 모아 드립니다.
      </p>

      <div className="mb-0.5 grid grid-cols-1 gap-1 sm:grid-cols-3">
        <input
          className="rounded border px-2 py-0.5 text-xs"
          placeholder="개월수"
          value={months}
          onChange={(e) => setMonths(e.target.value)}
        />
        <input
          className="rounded border px-2 py-0.5 text-xs"
          placeholder="시/도"
          value={sido}
          onChange={(e) => setSido(e.target.value)}
        />
        <input
          className="rounded border px-2 py-0.5 text-xs"
          placeholder="시/군/구"
          value={sigungu}
          onChange={(e) => setSigungu(e.target.value)}
        />
      </div>

      <div className="mb-0.5 flex flex-wrap gap-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => toggle(c.key)}
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              selected.includes(c.key)
                ? "bg-sky-500 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mb-0.5 flex gap-2">
        <input
          className="min-w-0 flex-1 rounded border px-2 py-0.5 text-xs"
          placeholder="예: 18개월, 강남구 육아 지원금 알려줘"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
        />
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="rounded bg-sky-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
        >
          {loading ? "찾는중..." : "조회하기"}
        </button>
      </div>

      {answer && (
        <div className="mb-1.5 max-h-28 overflow-y-auto rounded-lg bg-sky-50 p-2 text-xs text-gray-800">
          {answer}
        </div>
      )}
      <ul className="max-h-48 space-y-1.5 overflow-y-auto">
        {items.map((it) => (
          <li key={it.id} className="rounded-lg border bg-white/70 p-2">
            <p className="text-[11px] font-semibold text-sky-600">{it.category}</p>
            <p className="text-sm font-bold text-gray-900">{it.title}</p>
            <p className="text-xs text-gray-600">{it.summary}</p>
          </li>
        ))}
      </ul>
    </article>
  );
};

export default AssistantPanel;
