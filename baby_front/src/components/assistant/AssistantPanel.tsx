import { useEffect, useMemo, useState, type CSSProperties } from "react";
import * as babyInfoApi from "../../api/babyInfoApi";
import {
  ASSIST_CATEGORIES,
  assistantApi,
  type AssistItem,
} from "../../api/assistantApi";
import useCustomLogin from "../../hooks/useCustomLogin";

const monthsFromBirth = (birthDate?: string) => {
  if (!birthDate) return 6;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return 6;
  const now = new Date();
  return Math.max(
    0,
    (now.getFullYear() - birth.getFullYear()) * 12 +
      (now.getMonth() - birth.getMonth()),
  );
};

const categoryLabel = (category?: string) => {
  if (category === "CARE") return "아이돌봄";
  if (category === "VACCINATION") return "예방접종";
  return "지원금";
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
  const [babyName, setBabyName] = useState("");
  const [gender, setGender] = useState("");
  const [items, setItems] = useState<AssistItem[]>([]);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!isLogin) return;

    const loadBaby = () => {
      babyInfoApi
        .getList()
        .then((list) => {
          const baby = list?.[0];
          if (!baby) return;
          setBabyName(baby.babyName ?? "");
          setGender(baby.gender ?? "");
          setMonths(monthsFromBirth(baby.birthDate));
        })
        .catch(() => undefined);
    };

    loadBaby();
    window.addEventListener("focus", loadBaby);
    return () => window.removeEventListener("focus", loadBaby);
  }, [isLogin]);

  useEffect(() => {
    if (!isLogin) {
      setSido("");
      setSigungu("");
      return;
    }
    assistantApi
      .getRegion()
      .then((region) => {
        setSido(region.regionSido ?? "");
        setSigungu(region.regionSigungu ?? "");
      })
      .catch(() => undefined);
  }, [isLogin]);

  useEffect(() => {
    if (!isLogin) {
      setAnswer("");
      setItems([]);
      setLoading(false);
      setLive(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        if (live && (sido.trim() || sigungu.trim())) {
          try {
            await assistantApi.saveRegion({
              regionSido: sido.trim(),
              regionSigungu: sigungu.trim(),
            });
          } catch {
            // 거주지 저장 API가 아직 없으면 조회만 진행
          }
        }

        if (!live) {
          try {
            const snap = await assistantApi.snapshot();
            if (cancelled) return;
            if (snap.items?.length) {
              setAnswer(snap.answer);
              setItems(snap.items);
              return;
            }
          } catch {
            // 스냅샷이 없거나 실패하면 실시간 조회로 넘어감
          }
        }

        const res = await assistantApi.recommend({
          categories: ASSIST_CATEGORIES,
          child: {
            babyMonths: months,
            babyName: babyName || undefined,
            gender: gender || undefined,
            regionSido: sido.trim() || undefined,
            regionSigungu: sigungu.trim() || undefined,
          },
        });
        if (cancelled) return;
        setAnswer(res.answer);
        setItems(res.items ?? []);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setAnswer("지원금 정보를 불러오지 못했어요.");
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isLogin, live, months, sido, sigungu, babyName, gender]);

  const contextLine = useMemo(() => {
    const regionLabel = [sido, sigungu].filter(Boolean).join(" ");
    const who = babyName ? `${babyName} ` : "";
    if (answer) return answer;
    if (regionLabel) {
      return `현재 거주지(${regionLabel}) 및 자녀 월령(${who}${months}개월) 기준 신청 가능한 지원입니다.`;
    }
    return `자녀 월령(${who}${months}개월) 기준 신청 가능한 지원입니다. 거주지를 입력하면 지역 맞춤으로 보여 드려요.`;
  }, [answer, babyName, months, sido, sigungu]);

  return (
    <article
      id="ai-subsidy-panel"
      className={`card info supportbox support-panel${className ? ` ${className}` : ""}`}
      style={style}
    >
      <div className="assist-panel-head">
        <h3>
          <span className="assist-ai-mark" aria-hidden>
            ✦
          </span>
          AI 정부지원금
        </h3>
        <p>{contextLine}</p>
        <button
          type="button"
          className="assist-edit"
          onClick={() => setEditing((v) => !v)}
        >
          {editing ? "닫기" : "거주지·월령 수정"}
        </button>
      </div>

      {editing && (
        <div className="assist-fields">
          <input
            type="number"
            min={0}
            placeholder="개월수"
            value={months}
            onChange={(e) => {
              setLive(true);
              setMonths(Number(e.target.value) || 0);
            }}
            aria-label="개월수"
          />
          <input
            type="text"
            placeholder="시/도 (예: 서울)"
            value={sido}
            onChange={(e) => {
              setLive(true);
              setSido(e.target.value);
            }}
            aria-label="시/도"
          />
          <input
            type="text"
            placeholder="시/군/구 (예: 강남구)"
            value={sigungu}
            onChange={(e) => {
              setLive(true);
              setSigungu(e.target.value);
            }}
            aria-label="시/군/구"
          />
        </div>
      )}

      {!isLogin ? (
        <p className="assist-empty">
          로그인하고 아이를 등록하면, 월령에 맞는 지원금·시설을 보여 드려요.
        </p>
      ) : loading && items.length === 0 ? (
        <p className="assist-empty">신청 가능한 지원을 찾고 있어요…</p>
      ) : items.length === 0 ? (
        <p className="assist-empty">
          {answer ||
            "지금 조건에서 바로 신청할 지원이 없어요. 거주지와 아이 정보를 확인해 보세요."}
        </p>
      ) : (
        <ul className="assist-cards">
          {items.map((it, idx) => {
            const done = it.status === "DONE";
            return (
              <li key={it.id || `${it.title}-${idx}`}>
                <div>
                  <h4>
                    [{categoryLabel(it.category)}] {it.title}
                  </h4>
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
      )}
    </article>
  );
};

export default AssistantPanel;
