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

const AssistantPanel = () => {
  const [query, setQuery] = useState("");
  const [months, setMonths] = useState("");
  const [sido, setSido] = useState("서울");
  const [sigungu, setSigungu] = useState("");
  const [selected, setSelected] = useState<AssistCategory[]>([
    "CHILDCARE",
    "SUBSIDY",
  ]);
  const [answer, setAnswer] = useState("");
  const [items, setItems] = useState<AssistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const toggle = (key: AssistCategory) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const run = async () => {                     // 사용자가 고른 조건을 요청 한번으로 묶음 
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
      setAnswer(res.answer);        // 응답의 요약
      setItems(res.items ?? []);    // 응답의 목록
    } catch (e) {
      console.error(e);
      alert("육아 비서 요청에 실패했습니다. (API는 추후 연결)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full rounded-xl border bg-white p-4 shadow-md">
      <h2 className="mb-1 text-xl font-bold text-gray-900">AI 육아 비서</h2>
      <p className="mb-4 text-sm text-gray-600">
        아이 정보.지역 기준으로 어린이집, 지원금, 복지, 돌봄을 묶어 추천합니다
      </p>
      <div className="mb-3 grid-cols-1 gap-2  sm:grid-cols-3">
        <input
          className="rounded border px-3 py-2"
          placeholder="개월수"
          value={months}
          onChange={(e) => setMonths(e.target.value)}
        />
        <input
          className="rounded border px-3 py-2"
          placeholder="시/도"
          value={sido}
          onChange={(e) => setSido(e.target.value)}
        />
        <input
          className="rounded border px-3 py-2"
          placeholder="시/군/구"
          value={sigungu}
          onChange={(e) => setSigungu(e.target.value)}
        />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => toggle(c.key)}       // 카테고리칩 on/off 담당
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              selected.includes(c.key)
                ? "bg-sky-500 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="mb-3 flex gap-2">
        <input
          className="min-w-0 flex-1 rounded border px-3 py-2"
          placeholder="예: 강남구 18개월 어린이집이랑 지원금 알려줘"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
        />
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="rounded bg-sky-500 px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "찾는중... " : "추천받기"}
        </button>
      </div>
      {answer && (
        <div className="mb-3 rounded-lg bg-sky-50 p-3 text-sm text-gray-800">
          {answer}
        </div>
      )}
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.id} className="rounded-lg border p-3">
            <p className="text-xs font-semibold text-sky-600">{it.category}</p>
            <p className="font-bold text-gray-900">{it.title}</p>
            <p className="text-sm text-gray-600">{it.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default AssistantPanel;
