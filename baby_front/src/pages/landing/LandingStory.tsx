import { useEffect, useRef } from "react";

const REVIEWS = [
  { stars: "★★★★★", text: "\"이유식 성분표 검사 덕분에 알러지 걱정을 덜었어요. 새 이유식 살 때마다 제일 먼저 켜는 앱이 됐어요.\"", avatar: "🙋‍♀️", who: "28개월 아이 엄마" },
  { stars: "★★★★★", text: "\"새벽에 울음소리 분석 켜놓고 배고픈 건지 졸린 건지 바로 알 수 있어서 정말 큰 도움이 됐어요.\"", avatar: "🙋‍♂️", who: "5개월 아이 아빠" },
  { stars: "★★★★★", text: "\"감자마켓에서 안 쓰는 유모차 정리하고, 육아비는 가계부로 자동 정리돼서 지출 관리가 훨씬 편해졌어요.\"", avatar: "🙋‍♀️", who: "14개월 아이 엄마" },
];

const FAQ_ITEMS = [
  { q: "아이봄, 무료로 사용할 수 있나요?", a: "육아일기·성장기록·가계부 같은 기본 기록 기능과 AI 기능(울음소리 분석, 성분표 검사, 맞춤 동화 등)은 무료로 제공돼요.", open: true },
  { q: "여러 보호자가 한 아이 정보를 같이 관리할 수 있나요?", a: "네, 응애관리에서 아이를 등록해두면 부모가 함께 성장기록·육아일기·예방접종 현황을 확인하고 기록할 수 있어요." },
  { q: "감자마켓 거래는 안전한가요?", a: "매너온도와 거래 후기로 상대방을 미리 확인할 수 있고, 거래 완료 처리와 채팅 내역이 남아서 안심하고 육아용품을 사고팔 수 있어요." },
  { q: "베이비시터는 어떻게 매칭되나요?", a: "동네 기준으로 가까운 시터를 찾아 요청을 보내거나, 반대로 구인글을 올려 지원을 받을 수 있어요. 채팅으로 일정을 조율한 뒤 진행하시면 돼요." },
  { q: "AI 울음소리 분석·성분표 검사는 얼마나 정확한가요?", a: "배고픔·졸림·불편함 등 대표적인 울음 패턴과 알러지 유발 성분을 학습한 모델로 분석해드리는 참고용 가이드예요. 최종 판단은 보호자와 전문의 상담을 함께 참고해주세요." },
];

const LandingStory = () => {
  const rootRef = useRef<HTMLElement>(null);

  // 개월수 카드 선택 → 추천 문구 변경
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const cards = [...root.querySelectorAll<HTMLButtonElement>(".qs-age-card")];
    const reco = root.querySelector<HTMLElement>("#ageReco");
    const RECO = [
      "수면패턴 · 예방접종 · 피부 체크를 추천해요",
      "성분표 알러지 검사 · 이유식 퀘스트를 추천해요",
      "병원 찾기 · 베이비시터 · 커뮤니티를 추천해요",
    ];
    const handlers: Array<() => void> = [];
    cards.forEach((card) => {
      const handler = () => {
        cards.forEach((c) => c.classList.remove("active"));
        card.classList.add("active");
        if (reco) reco.textContent = RECO[Number(card.dataset.stage)];
      };
      handlers.push(handler);
      card.addEventListener("click", handler);
    });
    return () => {
      cards.forEach((card, i) => card.removeEventListener("click", handlers[i]));
    };
  }, []);

  // 후기 → FAQ → 퀵스타트 스크롤 화면전환 + 통계 숫자 카운트업
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const wrap = root;
    const quick = root.querySelector<HTMLElement>("#quickstartSection");
    if (!wrap) return;
    const isDesktop = () => window.matchMedia("(min-width: 901px)").matches;
    let ticking = false;
    let lastStage = -1;
    let countPlayed = false;
    let rafId = 0;
    const nums = quick ? [...quick.querySelectorAll<HTMLElement>("[data-count]")] : [];

    const formatInt = (n: number) => Math.round(n).toLocaleString("ko-KR");

    const playCount = () => {
      if (countPlayed || !nums.length) return;
      countPlayed = true;
      const duration = 1600;
      const start = performance.now();
      const frame = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const ease = 1 - Math.pow(1 - t, 3);
        nums.forEach((el) => {
          const target = parseFloat(el.dataset.count ?? "0");
          const decimals = parseInt(el.dataset.decimals ?? "0", 10);
          const suffix = el.dataset.suffix ?? "";
          const after = el.dataset.after ?? "";
          const val = target * ease;
          const shown = decimals > 0 ? val.toFixed(decimals) : formatInt(val);
          el.innerHTML = shown + suffix + after;
        });
        if (t < 1) rafId = requestAnimationFrame(frame);
      };
      rafId = requestAnimationFrame(frame);
    };

    const setStage = (stage: number) => {
      if (stage === lastStage) return;
      lastStage = stage;
      wrap.setAttribute("data-stage", String(stage));
      if (stage === 2) playCount();
    };

    const update = () => {
      if (!isDesktop()) {
        wrap.setAttribute("data-stage", "0");
        playCount();
        ticking = false;
        return;
      }
      const rect = wrap.getBoundingClientRect();
      const scrollable = wrap.offsetHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 0;
      let stage = 0;
      if (progress >= 0.66) stage = 2;
      else if (progress >= 0.33) stage = 1;
      setStage(stage);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section className="story-merge" id="reviewsSection" data-stage="0" ref={rootRef}>
      <div className="story-merge-sticky">
        <div className="story-dots" aria-hidden="true"><span /><span /><span /></div>

        <div className="story-slide story-slide--reviews" id="slideReviews">
          <div className="story-inner">
            <div className="reviews-head">
              <div className="eyebrow">TOGETHER</div>
              <h2>먼저 써본 부모님들의 이야기</h2>
            </div>
            <div className="reviews-grid">
              {REVIEWS.map((r, i) => (
                <div className="review-card" key={i}>
                  <div className="review-stars">{r.stars}</div>
                  <p className="review-text">{r.text}</p>
                  <div className="review-who"><span className="review-avatar">{r.avatar}</span><span>{r.who}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="story-slide story-slide--faq" id="slideFaq">
          <div className="story-inner" id="faqSection">
            <div className="faq-head">
              <div className="eyebrow">FAQ</div>
              <h2>시작 전에 궁금하신가요?</h2>
            </div>
            <div className="faq-list">
              {FAQ_ITEMS.map((f, i) => (
                <details className="faq-item" open={f.open} key={i}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>

        <div className="story-slide story-slide--quick" id="quickstartSection">
          <div className="story-inner">
            <div className="quickstart">
              <div className="qs-stats">
                <div className="qs-stat"><strong data-count="12400" data-suffix="+">0+</strong><span>함께하는 부모</span></div>
                <div className="qs-stat"><strong data-count="86000" data-suffix="+">0+</strong><span>누적 기록</span></div>
                <div className="qs-stat"><strong data-count="4.9" data-decimals="1" data-suffix="" data-after="<small>/5</small>">0.0<small>/5</small></strong><span>사용자 평점</span></div>
              </div>
              <div className="qs-age">
                <div className="qs-age-head">
                  <div className="eyebrow">FIND YOUR STAGE</div>
                  <h3>우리 아이는 몇 개월인가요?</h3>
                </div>
                <div className="qs-age-cards" id="ageCards">
                  <button className="qs-age-card active" type="button" data-stage="0">
                    <span className="qs-age-emoji">👶</span>
                    <span className="qs-age-label">신생아<br /><small>0~3개월</small></span>
                  </button>
                  <button className="qs-age-card" type="button" data-stage="1">
                    <span className="qs-age-emoji">🍼</span>
                    <span className="qs-age-label">이유식기<br /><small>4~12개월</small></span>
                  </button>
                  <button className="qs-age-card" type="button" data-stage="2">
                    <span className="qs-age-emoji">🚼</span>
                    <span className="qs-age-label">유아기<br /><small>13개월~</small></span>
                  </button>
                </div>
                <p className="qs-age-reco" id="ageReco">수면패턴 · 예방접종 · 피부 체크를 추천해요</p>
              </div>
              <div className="qs-quest-badge">오늘 기록하고 포인트 모아 리워드 받아보세요</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingStory;
