import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  assistantApi,
  type AssistItem,
} from "../../api/assistantApi";
import * as babyInfoApi from "../../api/babyInfoApi";
import useCustomLogin from "../../hooks/useCustomLogin";

const ageInMonthsFromBirth = (birthDate: string): number => {
  const birth = new Date(birthDate);
  const today = new Date();
  let months =
    (today.getFullYear() - birth.getFullYear()) * 12 +
    (today.getMonth() - birth.getMonth());
  if (today.getDate() < birth.getDate()) months -= 1;
  return Math.max(months, 0);
};

const INCOME_TAGS = ["저소득층", "차상위계층", "한부모·조손", "다자녀", "장애인가구"];

const PAGE_SIZE = 5;

const PolicyCards = ({ items }: { items: AssistItem[] }) => {
  const [shown, setShown] = useState(PAGE_SIZE);

  useEffect(() => {
    setShown(PAGE_SIZE);
  }, [items]);

  if (items.length === 0) {
    return <p className="assist-empty">아이 나이와 거주지를 입력하고 정책 찾기를 눌러 주세요.</p>;
  }

  const visible = items.slice(0, shown);
  const rest = items.length - visible.length;

  return (
    <>
      <ul className="assist-cards">
        {visible.map((it, idx) => {
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
      {rest > 0 ? (
        <button type="button" className="assist-more" onClick={() => setShown((n) => n + PAGE_SIZE)}>
          {rest}개 더보기
        </button>
      ) : null}
    </>
  );
};

interface AssistantPanelProps {
  className?: string;
  style?: CSSProperties;
}

const AssistantPanel = ({ className, style }: AssistantPanelProps) => {
  const { isLogin } = useCustomLogin();
  const [months, setMonths] = useState(6);
  const [hasBaby, setHasBaby] = useState(false);
  const [sido, setSido] = useState("");
  const [sigungu, setSigungu] = useState("");
  const [householdSize, setHouseholdSize] = useState<number | "">("");
  const [incomeTags, setIncomeTags] = useState<string[]>([]);
  const [items, setItems] = useState<AssistItem[]>([]);
  const [answer, setAnswer] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingRegion, setSavingRegion] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [askAnswer, setAskAnswer] = useState("");
  const [askSources, setAskSources] = useState<AssistItem[]>([]);

  useEffect(() => {
    if (!isLogin) {
      setSido("");
      setSigungu("");
      setMonths(6);
      setHasBaby(false);
      setItems([]);
      setAnswer("");
      setUpdatedAt("");
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const [region, snap, babies] = await Promise.all([
          assistantApi.getRegion(),
          assistantApi.snapshot(),
          babyInfoApi.getList().catch(() => []),
        ]);
        if (cancelled) return;
        setSido(region.regionSido ?? "");
        setSigungu(region.regionSigungu ?? "");

        if (babies.length > 0) {
          const youngest = [...babies].sort((a, b) =>
            b.birthDate.localeCompare(a.birthDate),
          )[0];
          setHasBaby(true);
          setMonths(ageInMonthsFromBirth(youngest.birthDate));
        } else {
          setHasBaby(false);
          if (region.babyMonths != null && region.babyMonths >= 0) {
            setMonths(region.babyMonths);
          }
        }

        setAnswer(snap.answer);
        setItems(snap.items ?? []);
        setUpdatedAt(snap.updatedAt ?? "");
      } catch {
        if (!cancelled) {
          setAnswer("저장된 지원금 목록을 불러오지 못했습니다.");
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
  

  const saveRegionOnly = async () => {
    setSavingRegion(true);
    setSavedMsg("");
    try {
      await assistantApi.saveRegion({
        regionSido: sido.trim(),
        regionSigungu: sigungu.trim(),
        babyMonths: months,
      });
      setSavedMsg("지역이 저장되었습니다.");
    } catch (e) {
      console.error(e);
      setSavedMsg("저장에 실패했어요.");
    } finally {
      setSavingRegion(false);
    }
  };

  const saveAndSearch = async () => {
    setExpanded(true);
    setSaving(true);
    setSavedMsg("");
    try {
      await assistantApi.saveRegion({
        regionSido: sido.trim(),
        regionSigungu: sigungu.trim(),
        babyMonths: months,
      });
      const res = await assistantApi.recommend({
        categories: ["SUBSIDY"],
        child: {
          babyMonths: months,
          regionSido: sido,
          householdSize: householdSize === "" ? undefined : householdSize,
          incomeTags,
        },
      });
      setAnswer(res.answer);
      setItems(res.items ?? []);
      setUpdatedAt(new Date().toISOString());
    } catch (e) {
      console.error(e);
      setAnswer("지원금 목록을 만들지 못했어요. 백엔드와 공공 API 키를 확인해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  const toggleIncomeTags = (tag: string) =>
    setIncomeTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );

  const askQuestion = async () => {
    if (!question.trim()) return;
    setAsking(true);
    setAskAnswer("");
    setAskSources([]);
    try {
      const res = await assistantApi.ask({
        query: question.trim(),
        child: { babyMonths: months, regionSido: sido },
      });
      setAskAnswer(res.answer);
      setAskSources(res.items ?? []);
    } catch (e) {
      console.error(e);
      setAskAnswer("답변을 가져오지 못했어요.");
    } finally {
      setAsking(false);
    }
  };

  return (
    <article
      id="ai-subsidy-panel"
      className={`gov-card gov-subsidy-panel${className ? ` ${className}` : ""}`}
      style={style}
    >
      {!expanded ? (
        <div className="gov-subsidy-collapsed">
          <h3>
            <span className="assist-ai-mark" aria-hidden>
              ✦
            </span>
            AI 정부지원금
          </h3>
          <p className="assist-hint">
            아이 나이(개월)와 거주지를 입력한 뒤 정책 찾기를 눌러 주세요.
          </p>

          <div className="assist-filters">
            <div className="assist-filter-group">
              <label htmlFor="assist-months">아이 나이(개월)</label>
              <input
                id="assist-months"
                type="number"
                min={0}
                placeholder="예: 8"
                value={months}
                disabled={!isLogin || hasBaby}
                onChange={(e) => setMonths(Number(e.target.value) || 0)}
              />
              {hasBaby ? (
                <small className="assist-hint">등록된 아이 정보로 자동 계산됨</small>
              ) : null}
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

          <button
            type="button"
            className="gov-subsidy-cta"
            onClick={() => void saveAndSearch()}
            disabled={!isLogin || saving}
          >
            {saving ? "찾는 중…" : "AI 정부지원금 찾기"}
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            className="gov-subsidy-close"
            onClick={() => setExpanded(false)}
          >
            <span aria-hidden>▲</span>
            검색창으로 접기
          </button>
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
              {savedMsg ? <p className="assist-hint">{savedMsg}</p> : null}
            </div>
            {isLogin ? (
              <div className="assist-panel-actions">
                <button
                  type="button"
                  className="assist-save"
                  onClick={() => void saveRegionOnly()}
                  disabled={savingRegion}
                >
                  {savingRegion ? "저장 중…" : "지역 저장"}
                </button>
                <button
                  type="button"
                  className="assist-edit"
                  onClick={() => void saveAndSearch()}
                  disabled={saving}
                >
                  {saving ? "찾는 중…" : "정책 찾기"}
                </button>
              </div>
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
                disabled={!isLogin || hasBaby}
                onChange={(e) => setMonths(Number(e.target.value) || 0)}
              />
              {hasBaby ? (
                <small className="assist-hint">등록된 아이 정보로 자동 계산됨</small>
              ) : null}
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
            <div className="assist-filter-group">
              <label htmlFor="assist-household">가족구성원수</label>
              <input
                id="assist-household"
                type="number"
                min={1}
                placeholder="예: 4"
                value={householdSize}
                disabled={!isLogin}
                onChange={(e) =>
                  setHouseholdSize(e.target.value ? Number(e.target.value) : "")
                }
              />
            </div>
          </div>

          <div className="assist-tag-group" role="group" aria-label="가구유형">
            {INCOME_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`assist-tag${incomeTags.includes(tag) ? " is-on" : ""}`}
                onClick={() => toggleIncomeTags(tag)}
                disabled={!isLogin}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="assist-ask">
            <label htmlFor="assist-question">AI에게 물어보기</label>
            <div>
              <input
                id="assist-question"
                type="text"
                placeholder="예: 다자녀 가구가 받을 수 있는 지원금은?"
                value={question}
                disabled={!isLogin}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void askQuestion();
                }}
              />
            </div>
            <div>
              <button type="button" onClick={() => void askQuestion()} disabled={!isLogin || asking}>
                {asking ? "생각 중…" : "질문하기"}
              </button>
            </div>
            {askAnswer ? (
              <div className="assist-ask-answer">
                <p>{askAnswer}</p>
                {askSources.length > 0 ? (
                  <p className="assist-ask-sources">
                    출처:{" "}
                    {askSources.map((s, idx) => (
                      <span key={s.id || idx}>
                        <a href={s.link || "https://www.bokjiro.go.kr"} target="_blank" rel="noreferrer">
                          {s.title}
                        </a>
                        {idx < askSources.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <PolicyCards items={items} />
        </>
      )}
    </article>
  );
};

export default AssistantPanel;
