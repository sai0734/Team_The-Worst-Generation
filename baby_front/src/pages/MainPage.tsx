import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BasicLayout from "../layouts/BasicLayout";
import useCustomLogin from "../hooks/useCustomLogin";
import * as ledgerApi from "../api/ledgerApi";
import type { LedgerSummary } from "../api/ledgerApi";
import * as recallApi from "../api/recallApi";
import type { MyProduct } from "../api/recallApi";

const formatWon = (n: number) => `${n.toLocaleString()}원`;

const MainPage = () => {
  const { isLogin } = useCustomLogin();

  const [ledgerSummary, setLedgerSummary] = useState<LedgerSummary | null>(null);
  const [recallProducts, setRecallProducts] = useState<MyProduct[] | null>(null);

  useEffect(() => {
    if (!isLogin) {
      setLedgerSummary(null);
      setRecallProducts(null);
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

  const expenseDelta = ledgerSummary
    ? ledgerSummary.totalExpense - ledgerSummary.prevTotalExpense
    : 0;

  const matchedCount =
    recallProducts?.filter((product) => product.recallMatched).length ?? 0;

  return (
    <BasicLayout>
      <section>
        <p className="eyebrow">BABY ALL-IN-ONE · D+214</p>
        <h1>
          오늘도 함께,
          <br />잘 키워가요.
        </h1>
        <p className="desc">
          하린이의 성장과 가족의 할 일을 한눈에 확인하세요.
          <br />
          놓치기 쉬운 안전 정보와 혜택까지 AI가 챙겨드려요.
        </p>
        <div className="summary">
          <span className="chip">🍼 마지막 수유 1시간 전</span>
          <span className="chip">🌙 수면 10시간 42분</span>
          <span className="chip">🔥 연속 기록 12일</span>
        </div>
      </section>

      <div className="content-stack">
        <section className="boards">
          <article className="card">
            <div className="head">
              <h2>오늘의 일일퀘스트</h2>
              <b>3 / 5 완료</b>
            </div>
            <div className="q">
              <i>✓</i>
              <span>아침 수유 180ml</span>
              <small>엄마</small>
            </div>
            <div className="q">
              <i>○</i>
              <span>오후 산책 30분</span>
              <small>함께</small>
            </div>
            <div className="q">
              <i>○</i>
              <span>저녁 목욕과 피부 확인</span>
              <small>아빠</small>
            </div>
          </article>
          <article className="card urgent">
            <span className="alert">긴급퀘스트</span>
            <strong>
              예방접종
              <br />
              D-2
            </strong>
            <p>오늘 병원 예약이 필요해요.</p>
          </article>
        </section>

        <section className="info-grid">
          <Link to="/ledger" className="card info moneybox">
            <small>우리집 가계부</small>
            {ledgerSummary ? (
              <>
                <strong>
                  이번 달 지출
                  <br />
                  {formatWon(ledgerSummary.totalExpense)}
                </strong>
                <p>
                  {expenseDelta === 0
                    ? "지난달과 지출이 같아요"
                    : expenseDelta > 0
                      ? `지난달보다 ${formatWon(expenseDelta)} 더 썼어요`
                      : `지난달보다 ${formatWon(-expenseDelta)} 아꼈어요`}
                </p>
              </>
            ) : (
              <>
                <strong>
                  우리집 가계부
                  <br />
                  기록해보기
                </strong>
                <p>
                  {isLogin
                    ? "아직 이번 달 기록이 없어요."
                    : "로그인하면 이번 달 지출을 볼 수 있어요."}
                </p>
              </>
            )}
          </Link>
          <Link to="/recall" className="card info recallbox">
            <small>AI 육아용품 리콜</small>
            {recallProducts && recallProducts.length > 0 ? (
              <>
                <strong>
                  {matchedCount > 0 ? (
                    <>
                      안전 확인이 필요한
                      <br />
                      제품 {matchedCount}건
                    </>
                  ) : (
                    <>
                      등록 제품
                      <br />
                      모두 안전해요
                    </>
                  )}
                </strong>
                <p>등록한 제품 {recallProducts.length}건과 최신 공고를 대조했어요.</p>
              </>
            ) : (
              <>
                <strong>
                  내 제품
                  <br />
                  등록해보기
                </strong>
                <p>
                  {isLogin
                    ? "등록된 제품이 없어요."
                    : "로그인하면 등록 제품의 리콜 여부를 확인할 수 있어요."}
                </p>
              </>
            )}
          </Link>
          <article className="card info supportbox">
            <small>AI 정부지원금</small>
            <strong>
              신청 가능한
              <br />
              맞춤 혜택 3건
            </strong>
            <p>예상 혜택 최대 월 35만원</p>
          </article>
        </section>
      </div>
    </BasicLayout>
  );
};

export default MainPage;
