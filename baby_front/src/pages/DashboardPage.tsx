import {
  useEffect,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import BasicLayout from "../layouts/BasicLayout";
import useCustomLogin from "../hooks/useCustomLogin";
import useQuestRealtime from "../hooks/useQuestRealtime";
import * as ledgerApi from "../api/ledgerApi";
import { CATEGORY_LABELS } from "../api/ledgerApi";
import type { LedgerCategory, LedgerSummary } from "../api/ledgerApi";
import * as recallApi from "../api/recallApi";
import type { MyProduct } from "../api/recallApi";
import { questApi, type MemberQuest, type QuestHome } from "../api/questApi";
import AssistantPanel from "../components/assistant/AssistantPanel";
import SkyBackground from "../components/common/SkyBackground";
import heroBaby from "../assets/hero-baby.png";
import heroBaby0 from "../assets/hero-baby0-wide.jpg";
import heroCry from "../assets/hero-cry-wide-v2.png";
import heroHomecam from "../assets/hero-homecam-wide-v2.png";
import heroMarket from "../assets/hero-market-wide.jpg";
import "../styles/dashboard-home.css";

const emptyHome: QuestHome = {
  dailyQuests: [],
  urgentQuests: [],
  point: 0,
};

const formatWon = (n: number) => `${n.toLocaleString()}원`;

const DAILY_TIPS = [
  "아기가 울 때 무조건 안아주기보다는 1~2분 정도 기다리며 스스로 진정할 기회를 주는 것도 좋아요.",
  "이유식 초기에는 새로운 재료를 하루에 하나씩만 시도해서 알레르기 반응을 확인하세요.",
  "수유 텀이 조금 불규칙해도 성장에 큰 문제가 없다면 너무 걱정하지 않아도 괜찮아요.",
  "낮잠을 너무 오래 재우면 밤잠 리듬이 깨질 수 있어요. 낮잠 시간을 정해두면 도움이 돼요.",
  "예방접종 스케줄은 미리 캘린더에 등록해두면 놓치지 않고 챙길 수 있어요.",
  "아기 방 온도는 22~24도, 습도는 50~60%가 적당해요.",
  "외출 전에는 여벌 옷과 기저귀를 넉넉히 챙기면 갑작스러운 상황에도 당황하지 않아요.",
];

const getTodayTip = () => {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
};

const questErrorMsg = (err: unknown) => {
  if (typeof err === "object" && err && "response" in err) {
    const data = (err as { response?: { data?: { msg?: string } } }).response
      ?.data;
    if (data?.msg) {
      return data.msg;
    }
  }
  return "보내지 못했습니다.";
};

const HERO_SLIDE_COUNT = 4;
const HERO_INTERVAL_MS = 5000;

// 슬라이드별 배경 사진 — Unsplash CDN의 자동 crop 파라미터를 신뢰할 수 없어서(요청 해상도를
// 무시하고 작은 이미지를 내려주는 경우가 있었음), 전부 원본 사진을 직접 와이드 구도로 잘라
// 좌측에 문구 여백을 확보한 project asset으로 박아넣음 (Unsplash 원본이 아니라서 사진작가
// 크레딧 없음)
const HERO_SLIDE_IMAGES = [heroBaby0, heroCry, heroHomecam, heroMarket];

// 홈 티커(좌측으로 흐르는 칩들) — 클릭하면 해당 기능으로 이동. 리콜/AI 정부지원금처럼
// 별도 페이지가 없는 기능은 이 대시보드 안의 카드 위치로 스크롤, 홈캠은 모달을 염
type TickerAction =
  | { type: "nav"; to: string }
  | { type: "scroll"; id: string }
  | { type: "homecam" };

const TICKER_ITEMS: { icon: string; label: string; action: TickerAction }[] = [
  { icon: "📔", label: "오늘의 육아일기 남겨보세요", action: { type: "nav", to: "/diary" } },
  { icon: "💸", label: "AI로 우리 동네 지원금 찾아보세요", action: { type: "scroll", id: "dashboard-subsidy" } },
  { icon: "💰", label: "가계부로 육아비 한눈에 정리해보세요", action: { type: "nav", to: "/ledger" } },
  { icon: "📷", label: "홈캠으로 낮잠시간 안심하게 지켜보세요", action: { type: "homecam" } },
  { icon: "🥕", label: "감자마켓에서 육아템 거래해보세요", action: { type: "nav", to: "/market" } },
  { icon: "👶", label: "믿을 수 있는 베이비시터 찾아보세요", action: { type: "nav", to: "/community/babysitter" } },
  { icon: "🍼", label: "AI 울음소리 분석 써보세요", action: { type: "nav", to: "/ai/cry-check" } },
  { icon: "🏥", label: "우리 아이 주변 소아과 찾아보세요", action: { type: "nav", to: "/hospital" } },
  { icon: "💬", label: "커뮤니티에서 육아 정보 나눠보세요", action: { type: "nav", to: "/community" } },
  { icon: "🔔", label: "육아용품 리콜 알림 확인해보세요", action: { type: "scroll", id: "dashboard-recall" } },
];

const DashboardPage = () => {
  const { isLogin, loginState } = useCustomLogin();
  const navigate = useNavigate();
  const location = useLocation();

  const [ledgerSummary, setLedgerSummary] = useState<LedgerSummary | null>(
    null,
  );
  const [recallProducts, setRecallProducts] = useState<MyProduct[] | null>(
    null,
  );

  const [home, setHome] = useState<QuestHome>(emptyHome);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [urgentTitle, setUrgentTitle] = useState("");
  const [urgentDesc, setUrgentDesc] = useState("");
  const [sendingUrgent, setSendingUrgent] = useState(false);
  const [urgentMsg, setUrgentMsg] = useState("");

  const [cardsIn, setCardsIn] = useState(false);
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    const t2 = setTimeout(() => setCardsIn(true), 200);
    return () => {
      clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(
      () => setHeroIdx((prev) => (prev + 1) % HERO_SLIDE_COUNT),
      HERO_INTERVAL_MS,
    );
    return () => clearInterval(interval);
  }, []);

  // 랜딩페이지 MORE 섹션에서 "/dashboard#dashboard-recall" 같은 링크로 들어왔을 때,
  // 해당 카드 위치로 자동 스크롤 (리콜/AI 정부지원금처럼 별도 페이지가 없는 기능용)
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    const t = setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => clearTimeout(t);
  }, [location.hash]);

  const loadQuests = async () => {
    try {
      const data = await questApi.getHome();
      setHome({
        dailyQuests: data.dailyQuests ?? [],
        urgentQuests: data.urgentQuests ?? [],
        point: data.point ?? 0,
      });
    } catch {
      try {
        const data = await questApi.getHome();
        setHome({
          dailyQuests: data.dailyQuests ?? [],
          urgentQuests: data.urgentQuests ?? [],
          point: data.point ?? 0,
        });
      } catch {
        setHome(emptyHome);
      }
    }
  };

  useEffect(() => {
    if (!isLogin) {
      setLedgerSummary(null);
      setRecallProducts(null);
      setHome(emptyHome);
      return;
    }

    ledgerApi
      .getSummary()
      .then(setLedgerSummary)
      .catch(() => setLedgerSummary(null));

    recallApi
      .getMyProductList()
      .then(setRecallProducts)
      .catch(() => setRecallProducts(null));
  }, [isLogin]);

  useEffect(() => {
    if (!isLogin) {
      setHome(emptyHome);
      return;
    }
    loadQuests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLogin, loginState.profileId]);

  useQuestRealtime(loginState.profileId, (quest: MemberQuest) => {
    setHome((prev) => {
      if (prev.urgentQuests.some((item) => item.id === quest.id)) {
        return prev;
      }
      return {
        ...prev,
        urgentQuests: [quest, ...prev.urgentQuests],
      };
    });
  });

  const handleToggle = async (id: number, done: boolean) => {
    setCompletingId(id);
    try {
      if (done) {
        await questApi.uncomplete(id);
      } else {
        await questApi.complete(id);
      }
      await loadQuests();
    } finally {
      setCompletingId(null);
    }
  };

  const handleTickerClick = (action: TickerAction) => {
    if (action.type === "nav") {
      navigate(action.to);
    } else if (action.type === "homecam") {
      window.dispatchEvent(new Event("open-homecam"));
    } else {
      document
        .getElementById(action.id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSendUrgent = async (event: FormEvent) => {
    event.preventDefault();
    const title = urgentTitle.trim();
    if (!title || sendingUrgent) {
      return;
    }
    setSendingUrgent(true);
    setUrgentMsg("");
    try {
      await questApi.createUrgent({
        title,
        description: urgentDesc.trim(),
        reward: 10,
        urgency: 8,
      });
      setUrgentTitle("");
      setUrgentDesc("");
      setUrgentMsg("상대 프로필에 보냈습니다.");
    } catch (err) {
      setUrgentMsg(questErrorMsg(err));
    } finally {
      setSendingUrgent(false);
    }
  };

  const expenseDelta = ledgerSummary
    ? ledgerSummary.totalExpense - ledgerSummary.prevTotalExpense
    : 0;

  const budgetPct = ledgerSummary
    ? ledgerSummary.prevTotalExpense > 0
      ? Math.min(
          100,
          Math.round(
            (ledgerSummary.totalExpense / ledgerSummary.prevTotalExpense) * 100,
          ),
        )
      : ledgerSummary.totalExpense > 0
        ? 100
        : 0
    : 0;

  const topCategories = ledgerSummary
    ? (
        Object.entries(ledgerSummary.categoryBreakdown) as [
          LedgerCategory,
          number,
        ][]
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
    : [];

  const matchedCount =
    recallProducts?.filter((product) => product.recallMatched).length ?? 0;

  const daily = home.dailyQuests;
  const openUrgents = home.urgentQuests.filter((q) => q.status !== "DONE");
  const done = daily.filter((q) => q.status === "DONE").length;
  const dailyPct = daily.length ? (done / daily.length) * 100 : 0;

  return (
    <BasicLayout>
      <div className="home-page-inner">
      <SkyBackground />

      <div className="home-content">
      <div className="home-hero-group">
      <section className="gov-hero">
        <div
          className={`gov-hero-slide${heroIdx === 0 ? " active" : ""}`}
          style={{ backgroundImage: `url(${HERO_SLIDE_IMAGES[0]})` }}
        >
          <div>
            <p className="eyebrow">TODAY</p>
            <h1>
              오늘도 함께, <b>잘 키워가요.</b>
            </h1>
            <p>
              아이봄과 함께하는 똑똑하고 편안한 육아 일기.{" "}
              {daily.length > 0
                ? `오늘의 할 일 ${daily.length - done}개가 남아있어요.`
                : ""}
            </p>
            <Link
              to="/babyInfo/input"
              className="gov-hero-cta"
              onClick={(e) => {
                e.preventDefault();
                navigate("/babyInfo/input");
              }}
            >
              우리 아이 등록하기
            </Link>
          </div>
          <img src={heroBaby} alt="" className="gov-hero-art" />
        </div>

        <div
          className={`gov-hero-slide${heroIdx === 1 ? " active" : ""}`}
          style={{ backgroundImage: `url(${HERO_SLIDE_IMAGES[1]})` }}
        >
          <div>
            <p className="eyebrow">AI 울음소리 분석</p>
            <h1>
              우리 아이가 왜 우는지
              <br />
              AI가 먼저 알려드려요
            </h1>
            <p>피치·볼륨·패턴을 분석해서 배고픔·졸림·불편함을 구분해요.</p>
            <Link
              to="/ai/cry-check"
              className="gov-hero-cta"
              onClick={(e) => {
                e.preventDefault();
                navigate("/ai/cry-check");
              }}
            >
              지금 분석하기
            </Link>
          </div>
          <span className="gov-hero-emoji">🍼</span>
        </div>

        <div
          className={`gov-hero-slide${heroIdx === 2 ? " active" : ""}`}
          style={{ backgroundImage: `url(${HERO_SLIDE_IMAGES[2]})` }}
        >
          <div>
            <p className="eyebrow">홈캠</p>
            <h1>
              낮잠시간, 안심하고
              <br />
              다른 일 하세요
            </h1>
            <p>안전영역을 벗어나면 바로 알려드려요.</p>
            <button
              type="button"
              className="gov-hero-cta"
              onClick={() => window.dispatchEvent(new Event("open-homecam"))}
            >
              지금 홈캠 열기
            </button>
          </div>
          <span className="gov-hero-emoji">📷</span>
        </div>

        <div
          className={`gov-hero-slide${heroIdx === 3 ? " active" : ""}`}
          style={{ backgroundImage: `url(${HERO_SLIDE_IMAGES[3]})` }}
        >
          <div>
            <p className="eyebrow">감자마켓</p>
            <h1>
              우리 동네 육아템,
              <br />
              필요한 만큼만
            </h1>
            <p>내 동네 기준 반경 5km 이내 매물을 한눈에.</p>
            <Link
              to="/market"
              className="gov-hero-cta"
              onClick={(e) => {
                e.preventDefault();
                navigate("/market");
              }}
            >
              둘러보기
            </Link>
          </div>
          <span className="gov-hero-emoji">🛒</span>
        </div>

        <div className="gov-hero-dots">
          {Array.from({ length: HERO_SLIDE_COUNT }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={idx === heroIdx ? "active" : ""}
              aria-label={`${idx + 1}번째 슬라이드`}
              onClick={() => setHeroIdx(idx)}
            />
          ))}
        </div>
      </section>

      <div className="home-ticker">
        <div className="home-ticker-track">
          {/* 끊김 없이 흐르도록 동일 세트를 한 번 더 반복 (총 2세트) */}
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <button
              type="button"
              key={i}
              className="home-ticker-chip"
              onClick={() => handleTickerClick(item.action)}
            >
              <i>{item.icon}</i>
              {item.label}
            </button>
          ))}
        </div>
      </div>
      </div>

      <div className="home-grid home-grid-v2 stagger">
        <article
          className={`gov-card gov-tip-row area-tip home-rise-up${cardsIn ? " in-view" : ""}`}
          style={{ "--i": 0 } as CSSProperties}
        >
          <span className="ico">💡</span>
          <p>{getTodayTip()}</p>
        </article>

        <article
          className={`gov-card gov-quest-card area-quest home-rise-up${cardsIn ? " in-view" : ""}`}
          style={{ "--i": 1 } as CSSProperties}
        >
          <div className="gov-quest-head">
            <h2>오늘의 할 일</h2>
            <b>
              {done} / {daily.length} 완료
            </b>
          </div>

          <div className="home-progress-track">
            <div
              className="home-progress-fill"
              style={{ width: `${dailyPct}%` }}
            />
          </div>

          {openUrgents.map((urgent) => (
            <div className="home-urgent-banner" key={urgent.id}>
              <span className="alert">긴급</span>
              <div className="home-urgent-body">
                <strong>{urgent.quest?.title ?? "긴급 퀘스트"}</strong>
                <p>
                  {urgent.quest?.description?.trim() ||
                    "확인이 필요한 긴급 할 일이에요."}
                </p>
              </div>
              <button
                type="button"
                className="ghost-btn"
                disabled={completingId === urgent.id}
                onClick={() => handleToggle(urgent.id, false)}
              >
                {completingId === urgent.id ? "처리 중..." : "완료"}
              </button>
            </div>
          ))}

          <form className="home-urgent-send" onSubmit={handleSendUrgent}>
            <p className="home-urgent-send-label">상대에게 긴급 할 일 보내기</p>
            <input
              type="text"
              value={urgentTitle}
              onChange={(e) => setUrgentTitle(e.target.value)}
              placeholder="예: 기저귀 사다 주세요"
              maxLength={40}
              disabled={!loginState.profileId || sendingUrgent}
            />
            <input
              type="text"
              value={urgentDesc}
              onChange={(e) => setUrgentDesc(e.target.value)}
              placeholder="설명 (선택)"
              maxLength={80}
              disabled={!loginState.profileId || sendingUrgent}
            />
            <button
              type="submit"
              className="ghost-btn"
              disabled={!loginState.profileId || sendingUrgent || !urgentTitle.trim()}
            >
              {sendingUrgent ? "보내는 중..." : "보내기"}
            </button>
            <small>
              {loginState.profileId
                ? urgentMsg
                : "프로필을 선택한 뒤 보낼 수 있어요."}
            </small>
          </form>

          {daily.length === 0 ? (
            <p className="empty-hint">배정된 일일 퀘스트가 없습니다.</p>
          ) : (
            <div className="home-task-grid">
              {daily.map((mq) => {
                const isDone = mq.status === "DONE";
                return (
                  <div
                    className={`home-task-tile${isDone ? " done" : ""}`}
                    key={mq.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (completingId === mq.id) return;
                      handleToggle(mq.id, isDone);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (completingId === mq.id) return;
                        handleToggle(mq.id, isDone);
                      }
                    }}
                    style={{
                      cursor: completingId === mq.id ? "wait" : "pointer",
                      opacity: completingId === mq.id ? 0.6 : 1,
                    }}
                  >
                    <i>{isDone ? "✓" : "○"}</i>
                    <div className="home-task-tile-text">
                      <span>{mq.quest?.title ?? "제목 없음"}</span>
                      <small>{mq.quest?.reward ?? 0}P</small>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <div className="home-side-col area-side">
        <Link
          to="/ledger"
          className={`gov-card gov-stat-card home-rise-up${cardsIn ? " in-view" : ""}`}
          style={{ "--i": 2 } as CSSProperties}
          onClick={(e) => {
            e.preventDefault();
            navigate("/ledger");
          }}
        >
          <small className="eyebrow">우리집 가계부</small>
          <strong className="home-side-amount">
            {ledgerSummary
              ? formatWon(ledgerSummary.totalExpense)
              : "기록 시작하기"}
          </strong>

          {ledgerSummary ? (
            <>
              <div className="home-progress-track thin">
                <div
                  className="home-progress-fill"
                  style={{ width: `${budgetPct}%` }}
                />
              </div>
              <p className="meta">
                {expenseDelta === 0
                  ? "지난달과 지출이 같아요"
                  : expenseDelta > 0
                    ? `지난달보다 ${formatWon(expenseDelta)} 더 썼어요`
                    : `지난달보다 ${formatWon(-expenseDelta)} 아꼈어요`}
              </p>
              {topCategories.length > 0 && (
                <ul className="home-expense-list">
                  {topCategories.map(([cat, amt]) => (
                    <li key={cat}>
                      <span>{CATEGORY_LABELS[cat]}</span>
                      <span>{formatWon(amt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="meta">아직 이번 달 기록이 없어요.</p>
          )}

          <span className="home-side-btn">가계부 상세 보기</span>
        </Link>

        <Link
          id="dashboard-recall"
          to="/recall"
          className={`gov-card gov-stat-card home-rise-up${cardsIn ? " in-view" : ""}`}
          style={{ "--i": 3 } as CSSProperties}
          onClick={(e) => {
            e.preventDefault();
            navigate("/recall");
          }}
        >
          <small className="eyebrow">AI 육아용품 리콜</small>
          {recallProducts && recallProducts.length > 0 ? (
            <>
              <strong className={`home-side-amount${matchedCount > 0 ? " is-alert" : ""}`}>
                {matchedCount > 0
                  ? `⚠️ 안전 확인 필요 ${matchedCount}건`
                  : "모두 안전해요"}
              </strong>
              <p className="meta">
                등록한 제품 {recallProducts.length}건과 최신 공고를 대조했어요.
              </p>
            </>
          ) : (
            <>
              <strong className="home-side-amount">내 제품 등록해보기</strong>
              <p className="meta">등록된 제품이 없어요.</p>
            </>
          )}
          <span className="home-side-btn">리콜 현황 보기</span>
        </Link>
        </div>
      </div>

      <div id="dashboard-subsidy">
        <AssistantPanel
          className={`gov-subsidy-hero-slot home-rise-up${cardsIn ? " in-view" : ""}`}
        />
      </div>
      </div>
      </div>
    </BasicLayout>
  );
};

export default DashboardPage;
