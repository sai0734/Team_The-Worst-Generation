import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import BasicLayout from "../layouts/BasicLayout";
import { questApi, type QuestHome } from "../api/questApi";
import AssistantPanel from "../components/assistant/AssistantPanel";
import type { RootState } from "../store";

const emptyHome: QuestHome = {
  dailyQuests: [],
  urgentQuests: [],
  point: 0,
};

const MainPage = () => {
  const loginState = useSelector((state: RootState) => state.loginSlice);
  const isLogin = Boolean(loginState.email);

  const [home, setHome] = useState<QuestHome>(emptyHome);
  const [completingId, setCompletingId] = useState<number | null>(null);

  const load = async () => {
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
      setHome(emptyHome);
      return;
    }
    load();
  }, [isLogin]);

  const handleToggle = async (id: number, done: boolean) => {
    setCompletingId(id);
    try {
      if (done) {
        await questApi.uncomplete(id);
      } else {
        await questApi.complete(id);
      }
      await load();
    } finally {
      setCompletingId(null);
    }
  };

  const daily = home.dailyQuests;
  const urgent = home.urgentQuests[0];
  const done = daily.filter((q) => q.status === "DONE").length;

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
        <div className="summary"></div>
      </section>

      <div className="content-stack">
        <section className="boards">
          <article className="card">
            <div className="head">
              <h2>오늘의 일일퀘스트</h2>
              <b>{isLogin ? `${done} / ${daily.length} 완료` : "-"}</b>
            </div>

            {!isLogin ? (
              <p>
                로그인하면 일일 퀘스트를 볼 수 있어요.{" "}
                <Link to="/member/login">로그인</Link>
              </p>
            ) : daily.length === 0 ? (
              <p>배정된 일일 퀘스트가 없습니다.</p>
            ) : (
              daily.map((mq) => {
                const isDone = mq.status === "DONE";
                return (
                  <div
                    className="q"
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
                    <span>{mq.quest?.title ?? "제목 없음"}</span>
                    <small>{mq.quest?.reward ?? 0}P</small>
                  </div>
                );
              })
            )}
          </article>

          <article className="card urgent">
            <span className="alert">긴급퀘스트</span>

            {!isLogin ? (
              <>
                <strong>로그인이 필요해요</strong>
                <p>
                  로그인하면 긴급 퀘스트를 볼 수 있어요.{" "}
                  <Link to="/member/login">로그인</Link>
                </p>
              </>
            ) : urgent ? (
              <>
                <strong>{urgent.quest?.title ?? "긴급 퀘스트"}</strong>
                <p>
                  {urgent.quest?.description?.trim()
                    ? urgent.quest.description
                    : urgent.status === "DONE"
                      ? "완료된 긴급 퀘스트입니다."
                      : "확인이 필요한 긴급 할 일이에요."}
                </p>
                {urgent.status !== "DONE" && (
                  <button
                    type="button"
                    disabled={completingId === urgent.id}
                    onClick={() => handleToggle(urgent.id, false)}
                    style={{ marginTop: 8 }}
                  >
                    {completingId === urgent.id ? "처리 중..." : "완료하기"}
                  </button>
                )}
              </>
            ) : (
              <>
                <strong>긴급 퀘스트 없음</strong>
                <p>지금은 배정된 긴급 퀘스트가 없어요.</p>
              </>
            )}
          </article>
        </section>

        <section className="info-grid">
          <article className="card info moneybox">
            <small>우리집 가계부</small>
            <strong>
              8월 육아 지출
              <br />
              428,500원
            </strong>
            <p>월 예산 700,000원의 61%</p>
          </article>
          <article className="card info recallbox">
            <small>AI 육아용품 리콜</small>
            <strong>
              안전 확인이 필요한
              <br />
              제품 1건
            </strong>
            <p>등록 제품과 최신 공고를 대조했어요.</p>
          </article>
        </section>

        {/* 기존 AI 육아 비서 기능 → AI 정부지원금 슬롯으로 이전 */}
        <AssistantPanel />
      </div>
    </BasicLayout>
  );
};

export default MainPage;
