import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BasicLayout from "../layouts/BasicLayout";
import useCustomLogin from "../hooks/useCustomLogin";
import * as ledgerApi from "../api/ledgerApi";
import { CATEGORY_LABELS } from "../api/ledgerApi";
import type { LedgerCategory, LedgerSummary } from "../api/ledgerApi";
import * as recallApi from "../api/recallApi";
import type { MyProduct } from "../api/recallApi";
import { questApi, type QuestHome } from "../api/questApi";
import AssistantPanel from "../components/assistant/AssistantPanel";
import heroBaby from "../assets/hero-baby.png";

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

const MainPage = () => {
  const { isLogin } = useCustomLogin();

  const [ledgerSummary, setLedgerSummary] = useState<LedgerSummary | null>(null);
  const [recallProducts, setRecallProducts] = useState<MyProduct[] | null>(null);

  const [home, setHome] = useState<QuestHome>(emptyHome);
  const [completingId, setCompletingId] = useState<number | null>(null);

  const loadQuests = async () => {
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

    loadQuests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLogin]);

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

  if (!isLogin) {
    return (
      <BasicLayout>
        <section className="home-hero home-hero--guest">
          <div className="home-hero-text">
            <span className="chip home-hero-chip">아이봄에 오신 것을 환영해요</span>
            <h1>
              오늘도 함께,
              <br />
              <b>잘 키워가요.</b>
            </h1>
            <p className="desc">
              아이봄과 함께하는 똑똑하고 편안한 육아 일기.
              <br />
              로그인하면 오늘의 할 일, 가계부, 리콜 알림을 한눈에 볼 수 있어요.
            </p>
            <Link to="/member/login" className="submit-btn home-hero-cta">
              로그인하고 시작하기
            </Link>
          </div>
          <img src={heroBaby} alt="" className="home-hero-art" />
        </section>
      </BasicLayout>
    );
  }

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
    ? (Object.entries(ledgerSummary.categoryBreakdown) as [LedgerCategory, number][])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
    : [];

  const matchedCount =
    recallProducts?.filter((product) => product.recallMatched).length ?? 0;

  const daily = home.dailyQuests;
  const urgent = home.urgentQuests[0];
  const done = daily.filter((q) => q.status === "DONE").length;
  const dailyPct = daily.length ? (done / daily.length) * 100 : 0;

  return (
    <BasicLayout>
      <section className="home-hero">
        <div className="home-hero-text">
          <span className="chip home-hero-chip">환영합니다!</span>
          <h1>
            오늘도 함께,
            <br />
            <b>잘 키워가요.</b>
          </h1>
          <p className="desc">아이봄과 함께하는 똑똑하고 편안한 육아 일기.</p>
          <Link to="/babyInfo/input" className="submit-btn home-hero-cta">
            우리 아이 등록하기
          </Link>
        </div>
        <img src={heroBaby} alt="" className="home-hero-art" />
      </section>

      <div className="home-grid">
        <article className="card home-tip-card area-tip">
          <p className="home-tip-label">💡 오늘의 꿀팁</p>
          <p className="home-tip-text">{getTodayTip()}</p>
        </article>

        <article className="card area-quest">
          <div className="head">
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

          {urgent && urgent.status !== "DONE" && (
            <div className="home-urgent-banner">
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
          )}

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

        <Link to="/ledger" className="card home-side-card area-ledger">
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

        <AssistantPanel className="area-assist" />

        <Link to="/recall" className="card home-side-card area-recall">
          <small className="eyebrow">AI 육아용품 리콜</small>
          {recallProducts && recallProducts.length > 0 ? (
            <>
              <strong className="home-side-amount">
                {matchedCount > 0
                  ? `안전 확인 필요 ${matchedCount}건`
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
    </BasicLayout>
  );
};

export default MainPage;
