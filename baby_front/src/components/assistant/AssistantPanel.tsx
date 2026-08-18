import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  assistantApi,
  type AssistItem,
} from "../../api/assistantApi";
import useCustomLogin from "../../hooks/useCustomLogin";

const SECTIONS = [
  { key: "local", title: "우리 지역 지원금" },
  { key: "national", title: "중앙부처 지원금" },
  { key: "care", title: "아이돌봄" },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

const sectionOf = (it: AssistItem): SectionKey => {
  if (it.category === "CARE") return "care";
  const source = it.source ?? "";
  if (source.includes("지자체")) return "local";
  return "national";
};

const PolicyCards = ({ items }: { items: AssistItem[] }) => {
  if (items.length === 0) {
    return <p className="assist-empty">아이 나이와 거주지를 입력하고 정책 찾기를 눌러 주세요.</p>;
  }
  return (
    <ul className="assist-cards">
      {items.map((it, idx) => {
        const done = it.status === "DONE";
        return (
          <li key={it.id || `${it.title}-${idx}`}>
            <div>
              <h4>{it.title}</h4>
              <p>{it.summary}</p>
            </div>
            {done ? (
              <span className="assist-status done">지급완료</span>
            ) : (
              <a
                className="assist-status apply"
                href={it.link || "https://www.bokjiro.go.kr"}
                target="_blank"
                rel="noreferrer"
              >
                신청하기
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
};

interface AssistantPanelProps {
  className?: string;
  style?: CSSProperties;
}

const AssistantPanel = ({ className, style }: AssistantPanelProps) => {
  const { isLogin } = useCustomLogin();
  const [months, setMonths] = useState(6);
  const [sido, setSido] = useState("");
  const [sigungu, setSigungu] = useState("");
  const [items, setItems] = useState<AssistItem[]>([]);
  const [answer, setAnswer] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>("local");

  useEffect(() => {
    if (!isLogin) {
      setSido("");
      setSigungu("");
      setMonths(6);
      setItems([]);
      setAnswer("");
      setUpdatedAt("");
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const [region, snap] = await Promise.all([
          assistantApi.getRegion(),
          assistantApi.snapshot(),
        ]);
        if (cancelled) return;
        setSido(region.regionSido ?? "");
        setSigungu(region.regionSigungu ?? "");
        if (region.babyMonths != null && region.babyMonths >= 0) {
          setMonths(region.babyMonths);
        }
        setAnswer(snap.answer);
        setItems(snap.items ?? []);
        setUpdatedAt(snap.updatedAt ?? "");
      } catch {
        if (!cancelled) {
          setAnswer("저장된 지원금 목록을 불러오지 못했어요.");
          setItems([]);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [isLogin]);

  const regionLabel = [sido, sigungu].filter(Boolean).join(" ");
  const profileLine = useMemo(
    () => `${months}개월 · ${regionLabel || "거주지 미입력"}`,
    [months, regionLabel],
  );
  const grouped = useMemo(() => {
    const buckets: Record<SectionKey, AssistItem[]> = {
      local: [],
      national: [],
      care: [],
    };
    for (const it of items) {
      buckets[sectionOf(it)].push(it);
    }
    return buckets;
  }, [items]);
  const visibleItems = grouped[activeSection];

  const saveAndSearch = async () => {
    setSaving(true);
    try {
      await assistantApi.saveRegion({
        regionSido: sido.trim(),
        regionSigungu: sigungu.trim(),
        babyMonths: months,
      });
      const snap = await assistantApi.refresh();
      setAnswer(snap.answer);
      setItems(snap.items ?? []);
      setUpdatedAt(snap.updatedAt ?? "");
    } catch (e) {
      console.error(e);
      setAnswer("지원금 목록을 만들지 못했어요. 백엔드와 공공 API 키를 확인해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <article
      id="ai-subsidy-panel"
      className={`card info supportbox support-panel${className ? ` ${className}` : ""}`}
      style={style}
    >
      <div className="assist-panel-head">
        <div className="assist-panel-copy">
          <h3>
            <span className="assist-ai-mark" aria-hidden>
              ✦
            </span>
            AI 정부지원금
          </h3>
          {isLogin ? <p className="assist-profile">{profileLine}</p> : null}
          <p className="assist-hint">
            아이 나이(개월)와 거주지를 입력한 뒤 정책 찾기를 눌러 주세요.
          </p>
          {updatedAt && !Number.isNaN(new Date(updatedAt).getTime()) ? (
            <p className="assist-hint">
              마지막 갱신 {new Date(updatedAt).toLocaleTimeString("ko-KR")}
            </p>
          ) : null}
        </div>
        {isLogin ? (
          <button
            type="button"
            className="assist-edit"
            onClick={() => void saveAndSearch()}
            disabled={saving}
          >
            {saving ? "찾는 중…" : "정책 찾기"}
          </button>
        ) : null}
      </div>

      <div className="assist-filters">
        <div className="assist-filter-group">
          <label htmlFor="assist-months">아이 나이(개월)</label>
          <input
            id="assist-months"
            type="number"
            min={0}
            placeholder="예: 8"
            value={months}
            disabled={!isLogin}
            onChange={(e) => setMonths(Number(e.target.value) || 0)}
          />
        </div>
        <div className="assist-filter-group">
          <label htmlFor="assist-sido">시/도</label>
          <input
            id="assist-sido"
            type="text"
            placeholder="예: 서울"
            value={sido}
            disabled={!isLogin}
            onChange={(e) => setSido(e.target.value)}
          />
        </div>
        <div className="assist-filter-group">
          <label htmlFor="assist-sigungu">시/군/구</label>
          <input
            id="assist-sigungu"
            type="text"
            placeholder="예: 강남구"
            value={sigungu}
            disabled={!isLogin}
            onChange={(e) => setSigungu(e.target.value)}
          />
        </div>
      </div>

      <div className="assist-filter-btns" role="tablist" aria-label="정책 종류">
        {SECTIONS.map((section) => {
          const count = grouped[section.key].length;
          const on = activeSection === section.key;
          return (
            <button
              key={section.key}
              type="button"
              role="tab"
              aria-selected={on}
              className={`assist-filter-btn${on ? " is-on" : ""}`}
              onClick={() => setActiveSection(section.key)}
            >
              <span>{section.title}</span>
              <em>{count}</em>
            </button>
          );
        })}
      </div>

      <PolicyCards items={visibleItems} />
    </article>
  );
};

export default AssistantPanel;
