import { useEffect, useRef } from "react";

const LandingHero = () => {
  const rootRef = useRef<HTMLElement>(null);

  // "아이봄" 글자 스크램블 리빌
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const brandEl = root.querySelector<HTMLElement>(".hero-inner h1 span");
    if (!brandEl) return;

    const finalText = brandEl.textContent ?? "";
    const pool = "가나다라마바사아자차카타파하응이봄들숨결온기품안녕꿈길빛솜";
    const len = finalText.length;
    const perCharDelay = 140;
    const tick = 45;
    const settleAt = 320;
    const totalTime = (len - 1) * perCharDelay + settleAt + 60;

    let intervalId: number | undefined;
    const startTimer = window.setTimeout(() => {
      const startTime = Date.now();
      intervalId = window.setInterval(() => {
        const now = Date.now() - startTime;
        let out = "";
        for (let i = 0; i < len; i++) {
          out += now >= i * perCharDelay + settleAt ? finalText[i] : pool[Math.floor(Math.random() * pool.length)];
        }
        brandEl.textContent = out;
        if (now >= totalTime) {
          brandEl.textContent = finalText;
          if (intervalId) window.clearInterval(intervalId);
        }
      }, tick);
    }, 500);

    return () => {
      window.clearTimeout(startTimer);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, []);

  return (
    <section className="hero" id="home" ref={rootRef}>
      <div className="hero-video" aria-hidden="true">
        <video autoPlay muted loop playsInline preload="auto">
          <source src="/landing/main.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="hero-anim" aria-hidden="true">
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />
        <span className="orbit-dot d1" />
        <span className="orbit-dot d2" />
        <span className="orbit-dot d3" />
        <span className="orbit-dot d4" />
      </div>
      <div className="hero-inner">
        <div className="eyebrow">AI로 함께 키우는 육아 파트너</div>
        <h1>
          우리 아이의 오늘,
          <br />
          <span>아이봄</span>이 함께 지켜봐요
        </h1>
        <p>기록은 가볍게, 걱정은 가볍지 않게 — 성장부터 안전까지 하루를 담아요.</p>
        <div className="cta">
          <a className="btn primary" href="#timelineWrap">지금 시작하기</a>
          <a className="btn ghost" href="#timelineWrap">서비스 둘러보기</a>
        </div>
      </div>
      <div className="scroll-cue">
        <span>SCROLL</span>
        <span className="line" />
      </div>
    </section>
  );
};

export default LandingHero;
