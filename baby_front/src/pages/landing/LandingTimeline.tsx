import { useEffect, useRef } from "react";

// 밤하늘/베일에 쓰이는 별 63개의 (left%, top%, delay s, duration s)
const STARS: Array<[number, number, number, number]> = [
  [67.4, 56.9, 1.2, 2.7], [39.6, 71.8, 0.7, 2.2], [26.6, 20.2, 0.8, 2.3], [11.5, 24.8, 0.7, 2.7],
  [20.8, 7.0, 0.5, 2.7], [39.1, 53.3, 1.9, 2.5], [10.7, 53.0, 1.8, 2.5], [65.5, 22.9, 2.2, 3.1],
  [78.6, 68.8, 0.6, 2.7], [72.7, 58.1, 0.9, 2.2], [62.4, 9.3, 1.7, 2.0], [45.5, 35.6, 0.3, 2.6],
  [50.0, 27.8, 2.2, 3.1], [88.3, 19.1, 0.1, 2.5], [12.1, 51.4, 0.6, 2.2], [28.8, 30.2, 1.8, 2.6],
  [30.5, 49.4, 0.1, 2.3], [68.4, 54.6, 0.2, 2.1], [50.6, 48.0, 0.0, 2.6], [27.9, 8.0, 0.4, 2.4],
  [46.8, 9.9, 1.5, 3.1], [68.0, 6.8, 1.6, 2.8], [1.9, 28.9, 1.6, 3.2], [92.0, 41.9, 1.4, 3.2],
  [21.6, 37.6, 0.1, 3.0], [65.1, 16.7, 0.5, 2.7], [74.7, 11.5, 0.8, 2.7], [26.6, 63.9, 1.7, 3.2],
  [63.8, 49.7, 0.7, 2.7], [43.1, 35.5, 0.1, 3.1], [16.1, 34.1, 2.2, 2.7], [86.1, 20.2, 1.1, 2.5],
  [32.8, 27.9, 1.1, 3.1], [96.2, 8.6, 1.6, 2.7], [41.5, 4.9, 0.9, 2.4], [37.0, 43.5, 0.9, 2.4],
  [27.9, 70.4, 0.9, 3.3], [17.2, 48.5, 1.3, 2.9], [51.4, 63.2, 1.4, 2.1], [67.9, 44.9, 0.6, 2.9],
  [82.9, 21.4, 0.4, 2.4], [58.8, 33.1, 0.2, 2.6], [54.6, 42.5, 0.8, 3.0], [67.3, 20.1, 0.8, 3.2],
  [22.7, 33.3, 0.7, 2.8], [78.9, 10.6, 0.5, 2.1], [13.3, 38.4, 1.2, 3.2], [45.4, 38.8, 0.1, 2.3],
  [31.3, 19.1, 1.9, 2.5], [14.4, 39.4, 0.4, 2.2], [60.6, 8.0, 1.8, 2.6], [7.3, 49.2, 2.3, 3.0],
  [83.5, 67.7, 0.7, 2.6], [73.6, 29.8, 2.3, 2.6], [3.1, 8.7, 1.0, 2.0], [60.8, 71.6, 2.2, 3.3],
  [25.4, 14.6, 0.2, 3.2], [3.5, 7.1, 1.6, 3.2], [53.3, 6.4, 0.1, 3.1], [68.5, 23.7, 2.4, 2.4],
  [15.5, 69.6, 0.1, 2.5], [18.6, 46.8, 1.2, 2.3], [62.5, 9.5, 2.4, 3.0],
];

const StarField = () => (
  <>
    {STARS.map(([left, top, delay, duration], i) => (
      <span
        key={i}
        className="star"
        style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${delay}s`, animationDuration: `${duration}s` }}
      />
    ))}
  </>
);

const LandingTimeline = () => {
  const rootRef = useRef<HTMLElement>(null);

  // 하루 사이클 (밤→아침 인트로, 시간대별 하늘/태양/구름, 좌우 화살표 이동)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const q = <T extends HTMLElement = HTMLElement>(sel: string) => root.querySelector<T>(sel);
    const qa = <T extends HTMLElement = HTMLElement>(sel: string) => [...root.querySelectorAll<T>(sel)];

    const wrap = root;
    const sticky = q(".timeline-sticky");
    const track = q("#timelineTrack");
    const dots = qa(".tl-dot");
    const arrowPrev = q<HTMLButtonElement>("#tlArrowPrev");
    const arrowNext = q<HTMLButtonElement>("#tlArrowNext");
    const skyMorning = q("#skyMorning");
    const skyNoon = q("#skyNoon");
    const skyEvening = q("#skyEvening");
    const skyNight = q("#skyNight");
    const clouds = q("#tlClouds");
    const sun = q("#tlSun");
    const moon = q("#tlMoon");
    const sky = q("#tlSky");
    const ground = q("#tlGround");
    const buildings = q("#tlBuildings");
    const timelineHeadEl = q(".timeline-head");
    if (!wrap || !sticky || !track || !skyMorning || !skyNoon || !skyEvening || !skyNight
      || !clouds || !sun || !moon || !sky || !ground || !buildings || !timelineHeadEl) return;

    const isDesktop = () => window.matchMedia("(min-width: 901px)").matches;

    const STAGES = [
      { sky: [1, 0, 0, 0], angle: 150, clouds: 0 },
      { sky: [0.6, 0.4, 0, 0], angle: 120, clouds: 1 },
      { sky: [0.2, 0.8, 0, 0], angle: 90, clouds: 1 },
      { sky: [0, 0.8, 0.2, 0], angle: 60, clouds: 1 },
      { sky: [0, 0.3, 0.6, 0.1], angle: 30, clouds: 0 },
      { sky: [0, 0, 0, 1], angle: 10, clouds: 0 },
    ];

    const ORBIT = { cx: 50, cy: 62, rx: 42, ry: 42 };
    const GROUND_BURY = 0.88;
    const ENTRY_ANGLE = 196;

    function syncOrbitToEarth() {
      if (!sky || !ground) return;
      const skyRect = sky.getBoundingClientRect();
      const w = ground.getBoundingClientRect().width;
      if (!skyRect.width || !skyRect.height || !w) return;
      const rEarth = w / 2;
      const centerY = skyRect.bottom + GROUND_BURY * w - rEarth;
      const radiusPx = (centerY - skyRect.top) * 0.86;
      ORBIT.cx = 50;
      ORBIT.cy = ((centerY - skyRect.top) / skyRect.height) * 100;
      ORBIT.rx = Math.min((radiusPx / skyRect.width) * 100, 42);
      ORBIT.ry = (radiusPx / skyRect.height) * 100;
    }

    function orbitPoint(deg: number) {
      const rad = (deg * Math.PI) / 180;
      return { x: ORBIT.cx + ORBIT.rx * Math.cos(rad), y: ORBIT.cy - ORBIT.ry * Math.sin(rad) };
    }

    syncOrbitToEarth();

    let index = 0;
    let animating = false;
    let introDone = false;
    let sunAngle = ENTRY_ANGLE;
    let moonAngle = ENTRY_ANGLE;
    let sunAnim: Animation | null = null;
    let moonAnim: Animation | null = null;
    let introTimer1: number | null = null;
    let introTimer2: number | null = null;
    const COOLDOWN = 975;
    const MOON_REST_ANGLE = 128;
    const NIGHT_STAGE = STAGES.length - 1;
    const pendingTimeouts = new Set<number>();
    const setT = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        pendingTimeouts.delete(id);
        fn();
      }, ms);
      pendingTimeouts.add(id);
      return id;
    };

    function arcBodyTo(el: HTMLElement, fromAngle: number, toAngle: number, duration: number, onDone?: () => void) {
      const steps = 12;
      const kfs: Keyframe[] = [];
      for (let i = 0; i <= steps; i++) {
        const a = fromAngle + (toAngle - fromAngle) * (i / steps);
        const p = orbitPoint(a);
        kfs.push({ left: p.x + "%", top: p.y + "%" });
      }
      const end = orbitPoint(toAngle);
      el.style.left = end.x + "%";
      el.style.top = end.y + "%";
      let anim: Animation | null = null;
      if (el.animate) {
        anim = el.animate(kfs, { duration, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" });
        if (onDone) anim.onfinish = onDone;
      } else if (onDone) {
        onDone();
      }
      return anim;
    }

    function arcSunTo(toAngle: number, duration: number, onDone?: () => void) {
      if (sunAnim) { sunAnim.cancel(); sunAnim = null; }
      sunAnim = arcBodyTo(sun!, sunAngle, toAngle, duration, onDone);
      sunAngle = toAngle;
    }

    function arcMoonTo(toAngle: number, duration: number, onDone?: () => void) {
      if (moonAnim) { moonAnim.cancel(); moonAnim = null; }
      moonAnim = arcBodyTo(moon!, moonAngle, toAngle, duration, onDone);
      moonAngle = toAngle;
    }

    const startPos = orbitPoint(ENTRY_ANGLE);
    sun.style.left = startPos.x + "%";
    sun.style.top = startPos.y + "%";
    moon.style.left = startPos.x + "%";
    moon.style.top = startPos.y + "%";

    const SUN_SET_ANGLE = 0;

    function updateDayNight(idx: number, duration: number) {
      const isNight = idx === NIGHT_STAGE;
      sticky!.classList.toggle("is-night", isNight);
      if (isNight) {
        sun!.style.opacity = "1";
        arcSunTo(SUN_SET_ANGLE, duration);
        setT(() => { sun!.style.opacity = "0"; }, duration * 0.55);
        moon!.style.opacity = "1";
        arcMoonTo(MOON_REST_ANGLE, duration);
      } else {
        sun!.style.opacity = "1";
        arcSunTo(STAGES[idx].angle, duration);
        moon!.style.opacity = "0";
        if (moonAngle !== ENTRY_ANGLE) {
          arcMoonTo(ENTRY_ANGLE, duration);
        }
      }
    }

    function render() {
      track!.style.transform = `translateX(-${index * (100 / STAGES.length)}%)`;
      dots.forEach((d, i) => d.classList.toggle("active", i === index));
      if (arrowPrev) arrowPrev.disabled = index <= 0;
      if (arrowNext) arrowNext.disabled = index >= STAGES.length - 1;
      const s = STAGES[index];
      skyMorning!.style.opacity = String(s.sky[0]);
      skyNoon!.style.opacity = String(s.sky[1]);
      skyEvening!.style.opacity = String(s.sky[2]);
      skyNight!.style.opacity = String(s.sky[3]);
      clouds!.style.opacity = String(s.clouds);
    }

    const CLOUD_ANIMS = ["cloudFlowA", "cloudFlowB", "cloudFlowC"].map((n) => `landing${n[0].toUpperCase()}${n.slice(1)}`);
    const CLOUD_SHAPES = ["shape-1", "shape-2", "shape-3", "shape-4"];
    const cloudEls = qa(".tl-cloud");

    function randomizeClouds() {
      cloudEls.forEach((el) => {
        const anim = CLOUD_ANIMS[Math.floor(Math.random() * CLOUD_ANIMS.length)];
        const shape = CLOUD_SHAPES[Math.floor(Math.random() * CLOUD_SHAPES.length)];
        const dur = 30 + Math.random() * 50;
        const delay = -(Math.random() * dur).toFixed(1);
        const top = (4 + Math.random() * 52).toFixed(1);
        el.classList.remove("shape-1", "shape-2", "shape-3", "shape-4");
        el.classList.add(shape);
        el.style.animation = "none";
        el.style.top = top + "%";
        void el.offsetWidth;
        el.style.animation = `${anim} ${dur.toFixed(1)}s linear infinite`;
        el.style.animationDelay = delay + "s";
      });
    }

    function wrapHeadingChars() {
      const h2 = timelineHeadEl!.querySelector<HTMLElement>("h2");
      if (!h2 || h2.dataset.wrapped) return;
      const chars = [...(h2.textContent ?? "")];
      h2.innerHTML = "";
      chars.forEach((ch, i) => {
        const span = document.createElement("span");
        span.className = "dchar";
        span.textContent = ch === " " ? " " : ch;
        span.style.animationDelay = i * 0.06 + "s";
        h2.appendChild(span);
      });
      h2.dataset.wrapped = "1";
    }

    function playBuildingBounce() {
      buildings!.classList.remove("bld-bounce");
      void buildings!.offsetWidth;
      buildings!.classList.add("bld-bounce");
    }
    function playHeadingDomino() {
      timelineHeadEl!.classList.remove("domino-play");
      void timelineHeadEl!.offsetWidth;
      timelineHeadEl!.classList.add("domino-play");
    }

    function goTo(next: number) {
      if (next === index || next < 0 || next > STAGES.length - 1) return;
      const prevHadClouds = STAGES[index].clouds;
      const nextHasClouds = STAGES[next].clouds;
      index = next;
      animating = true;
      render();
      updateDayNight(index, COOLDOWN - 50);
      playBuildingBounce();
      playHeadingDomino();
      if (nextHasClouds) {
        if (prevHadClouds) {
          clouds!.style.opacity = "0";
          setT(() => {
            randomizeClouds();
            clouds!.style.opacity = "1";
          }, 420);
        } else {
          randomizeClouds();
        }
      }
      setT(() => { animating = false; }, COOLDOWN);
    }

    function playIntro() {
      if (sticky!.classList.contains("intro-played")) return;
      const GROUND_BUILD_WAIT = 3250;
      const SUN_SKY_DURATION = 1500;

      sticky!.classList.add("intro-played");
      sticky!.classList.add("is-night");
      skyNight!.style.opacity = "1";

      introTimer1 = setT(() => {
        skyMorning!.style.transition = "opacity " + SUN_SKY_DURATION + "ms ease";
        skyNight!.style.transition = "opacity " + SUN_SKY_DURATION + "ms ease";
        skyMorning!.style.opacity = String(STAGES[0].sky[0]);
        skyNight!.style.opacity = String(STAGES[0].sky[3]);
        sticky!.classList.remove("is-night");
        arcSunTo(STAGES[0].angle, SUN_SKY_DURATION);
        introTimer2 = setT(() => {
          introDone = true;
          root.classList.add("intro-settled");
          skyMorning!.style.transition = "";
          skyNight!.style.transition = "";
        }, SUN_SKY_DURATION + 100);
      }, GROUND_BUILD_WAIT);
    }

    function finishIntroInstantly() {
      if (introDone) return;
      if (introTimer1) { window.clearTimeout(introTimer1); introTimer1 = null; }
      if (introTimer2) { window.clearTimeout(introTimer2); introTimer2 = null; }
      sticky!.classList.add("intro-played");
      sticky!.classList.remove("is-night");

      const buildingInners = buildings!.querySelectorAll<HTMLElement>(".bld-inner");
      ground!.style.transition = "none";
      ground!.style.transform = "translate(-50%, " + GROUND_BURY * 100 + "%)";
      buildingInners.forEach((el) => { el.style.transition = "none"; el.style.transform = "scaleY(1)"; });
      void ground!.offsetWidth;
      ground!.style.transition = "";
      buildingInners.forEach((el) => { el.style.transition = ""; });

      skyMorning!.style.transition = "none";
      skyNight!.style.transition = "none";
      skyMorning!.style.opacity = String(STAGES[0].sky[0]);
      skyNight!.style.opacity = String(STAGES[0].sky[3]);
      arcSunTo(STAGES[0].angle, 0);
      void skyMorning!.offsetWidth;
      skyMorning!.style.transition = "";
      skyNight!.style.transition = "";
      introDone = true;
      root.classList.add("intro-settled");
    }

    const onWheel = (e: WheelEvent) => {
      if (!isDesktop()) return;
      const r = wrap!.getBoundingClientRect();
      const inRange = r.top <= 0 && r.bottom > window.innerHeight;
      if (!inRange) return;

      if (!introDone) {
        e.preventDefault();
        if (e.deltaY > 0) finishIntroInstantly();
        return;
      }
    };
    window.addEventListener("wheel", onWheel, { passive: false });

    function goNext() {
      if (!introDone) { finishIntroInstantly(); return; }
      if (animating) return;
      if (index < STAGES.length - 1) goTo(index + 1);
    }
    function goPrev() {
      if (!introDone || animating) return;
      if (index > 0) goTo(index - 1);
    }
    arrowNext?.addEventListener("click", goNext);
    arrowPrev?.addEventListener("click", goPrev);

    const onResize = () => {
      syncOrbitToEarth();
      const p = orbitPoint(sunAngle);
      sun!.style.left = p.x + "%";
      sun!.style.top = p.y + "%";
      if (!isDesktop()) { track!.style.transform = ""; }
      else { render(); }
    };
    window.addEventListener("resize", onResize);

    let stickyArrivalChecking = false;
    function checkStickyArrival() {
      if (sticky!.classList.contains("intro-played") || stickyArrivalChecking) return;
      const r = sticky!.getBoundingClientRect();
      // top:0이 아니라 top:var(--nav-h)에 고정되므로(실제 상단 네비 아래에 붙음), 도착 판정도
      // 0이 아니라 그 오프셋 기준으로 해야 함 — 안 그러면 이 조건이 절대 참이 되지 않아
      // playIntro가 한 번도 실행되지 않고, 스크롤할 때마다 wheel 핸들러의 finishIntroInstantly()
      // (스킵용 비상경로)만 계속 타면서 애니메이션 없이 항상 즉시 최종 상태로 보이게 됨.
      const stickyTopOffset = parseFloat(getComputedStyle(sticky!).top) || 0;
      if (r.top <= stickyTopOffset) {
        stickyArrivalChecking = true;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            playIntro();
            window.removeEventListener("scroll", checkStickyArrival);
          });
        });
      }
    }
    window.addEventListener("scroll", checkStickyArrival, { passive: true });
    checkStickyArrival();

    render();
    skyMorning.style.opacity = "0";
    wrapHeadingChars();

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", checkStickyArrival);
      arrowNext?.removeEventListener("click", goNext);
      arrowPrev?.removeEventListener("click", goPrev);
      pendingTimeouts.forEach((id) => window.clearTimeout(id));
      if (sunAnim) sunAnim.cancel();
      if (moonAnim) moonAnim.cancel();
    };
  }, []);

  return (
    <section className="timeline-wrap" id="timelineWrap" ref={rootRef}>
      <div className="timeline-sticky">
        <div className="timeline-head">
          <div className="eyebrow">A DAY WITH 아이봄</div>
          <h2>하루의 흐름을 따라가는 케어</h2>
        </div>
        <div className="tl-sky" id="tlSky">
          <div className="tl-sky-layer morning" id="skyMorning" />
          <div className="tl-sky-layer noon" id="skyNoon" />
          <div className="tl-sky-layer evening" id="skyEvening" />
          <div className="tl-sky-layer night" id="skyNight">
            <div className="tl-night-stars">
              <StarField />
            </div>
            <span className="tl-meteor m1" />
            <span className="tl-meteor m2" />
            <span className="tl-meteor m3" />
          </div>
          <div className="tl-clouds" id="tlClouds">
            <span className="tl-cloud c1 shape-1" />
            <span className="tl-cloud c2 shape-3" />
            <span className="tl-cloud c3 shape-2" />
            <span className="tl-cloud c4 shape-4" />
            <span className="tl-cloud c5 shape-2" />
            <span className="tl-cloud c6 shape-3" />
          </div>
          <div className="tl-ground" id="tlGround">
            <div className="tl-ground-globe" />
          </div>
          <div className="tl-buildings" id="tlBuildings">
            {[32, 42, 54, 66, 80, 90, 76, 62, 48, 36].map((h, i) => (
              <span className="bld" key={i} style={{ height: `${h}%` }}>
                <span className="bld-inner" />
              </span>
            ))}
          </div>
          <div className="tl-sun" id="tlSun" />
          <div className="tl-moon" id="tlMoon">
            <span className="tl-moon-shape" />
          </div>
        </div>
        <div className="tl-intro-veil" id="tlVeil">
          <div className="tl-stars">
            <StarField />
          </div>
          <span className="tl-meteor m1" />
          <span className="tl-meteor m2" />
          <span className="tl-meteor m3" />
        </div>

        <div className="timeline-track" id="timelineTrack">
          <div className="tl-panel">
            <div className="tl-card">
              <div className="tl-media quest-media">
                <div className="quest-mock">
                  <div className="quest-mock-bar"><span className="qm-dot" /><span className="qm-dot" /><span className="qm-dot" /></div>
                  <div className="quest-mock-body">
                    <div className="qm-title">오늘의 이유식 메뉴 분석</div>
                    <div className="scan-box"><div className="scan-line" /><div className="scan-label">월령별 영양 성분 분석 중</div></div>
                    <span className="scan-result r1">철분 보충 필요</span>
                    <span className="scan-result r2">알러지 프리 메뉴</span>
                    <div className="qm-badge">오늘의 이유식 추천 완료</div>
                  </div>
                </div>
              </div>
              <div className="tl-text">
                <div className="tl-time">MORNING · 09:00</div>
                <div className="tl-title">오늘 뭘 먹일까,<br />AI가 골라줘요</div>
                <p className="tl-desc">월령별 이유식 레시피와 알러지 성분을 AI가 분석해서 오늘의 메뉴를 추천해요.</p>
                <div className="tl-chips"><span>이유식 레시피</span><span>알러지 분석</span><span>월령별 추천</span></div>
              </div>
            </div>
          </div>

          <div className="tl-panel">
            <div className="tl-card">
              <div className="tl-media quest-media">
                <div className="quest-mock">
                  <div className="quest-mock-bar"><span className="qm-dot" /><span className="qm-dot" /><span className="qm-dot" /></div>
                  <div className="quest-mock-body">
                    <div className="qm-title">오늘의 육아 퀘스트</div>
                    <div className="qm-row"><span className="q-check i1">✓</span><span className="qm-label">수유 기록하기</span></div>
                    <div className="qm-row"><span className="q-check i2">✓</span><span className="qm-label">기저귀 갈아주기</span></div>
                    <div className="qm-row"><span className="q-check i3">✓</span><span className="qm-label">낮잠 재우기</span></div>
                    <div className="qm-progress"><div className="qm-progress-fill" /></div>
                    <div className="qm-badge">퀘스트 완료! +10P</div>
                  </div>
                </div>
              </div>
              <div className="tl-text">
                <div className="tl-time">MORNING · 11:00</div>
                <div className="tl-title">오늘의 육아 퀘스트,<br />하나씩 완료해요</div>
                <p className="tl-desc">수유, 기저귀, 낮잠 같은 오늘의 할 일을 퀘스트로 만들어 가볍게 완료하고 포인트를 모아요.</p>
                <div className="tl-chips"><span>오늘의 퀘스트</span><span>포인트 리워드</span><span>완료 체크</span></div>
              </div>
            </div>
          </div>

          <div className="tl-panel">
            <div className="tl-card">
              <div className="tl-media quest-media">
                <div className="quest-mock">
                  <div className="quest-mock-bar"><span className="qm-dot" /><span className="qm-dot" /><span className="qm-dot" /></div>
                  <div className="quest-mock-body">
                    <div className="qm-title">낮잠 홈캠 모니터링</div>
                    <div className="qm-row"><span className="q-check i1">✓</span><span className="qm-label">실시간 화면 확인</span></div>
                    <div className="qm-row"><span className="q-check i2">✓</span><span className="qm-label">숨소리·뒤척임 체크</span></div>
                    <div className="qm-row"><span className="q-check i3">✓</span><span className="qm-label">이상 알림 설정</span></div>
                    <div className="qm-progress"><div className="qm-progress-fill" /></div>
                    <div className="qm-badge">편안하게 잘 자고 있어요</div>
                  </div>
                </div>
              </div>
              <div className="tl-text">
                <div className="tl-time">AFTERNOON · 15:00</div>
                <div className="tl-title">낮잠 시간,<br />홈캠으로 안심해요</div>
                <p className="tl-desc">아이가 낮잠 자는 동안 홈캠으로 실시간 확인하고, 뒤척임이나 울음도 바로 알림받아요.</p>
                <div className="tl-chips"><span>실시간 홈캠</span><span>낮잠 알림</span><span>이상 감지</span></div>
              </div>
            </div>
          </div>

          <div className="tl-panel">
            <div className="tl-card">
              <div className="tl-media quest-media">
                <div className="quest-mock">
                  <div className="quest-mock-bar"><span className="qm-dot" /><span className="qm-dot" /><span className="qm-dot" /></div>
                  <div className="quest-mock-body">
                    <div className="qm-title">오늘의 육아비 정리</div>
                    <div className="ledger-row"><span className="ledger-dot" style={{ background: "#A0DEFF" }} /><span className="ledger-label">기저귀</span><span className="ledger-bar"><span className="ledger-fill f1" /></span></div>
                    <div className="ledger-row"><span className="ledger-dot" style={{ background: "#CAF4FF" }} /><span className="ledger-label">이유식</span><span className="ledger-bar"><span className="ledger-fill f2" /></span></div>
                    <div className="ledger-row"><span className="ledger-dot" style={{ background: "#5AB2FF" }} /><span className="ledger-label">병원비</span><span className="ledger-bar"><span className="ledger-fill f3" /></span></div>
                    <div className="qm-badge">오늘 지출 32,000원</div>
                  </div>
                </div>
              </div>
              <div className="tl-text">
                <div className="tl-time">EVENING · 18:00</div>
                <div className="tl-title">육아비 지출,<br />한눈에 정리해요</div>
                <p className="tl-desc">기저귀, 이유식, 병원비까지 육아 관련 지출을 자동으로 분류해서 가계부로 정리해요.</p>
                <div className="tl-chips"><span>자동 분류</span><span>지출 리포트</span><span>카테고리별 통계</span></div>
              </div>
            </div>
          </div>

          <div className="tl-panel">
            <div className="tl-card">
              <div className="tl-media quest-media">
                <div className="quest-mock">
                  <div className="quest-mock-bar"><span className="qm-dot" /><span className="qm-dot" /><span className="qm-dot" /></div>
                  <div className="quest-mock-body">
                    <div className="qm-title">오늘의 육아일기</div>
                    <div className="qm-row"><span className="q-check i1">✓</span><span className="qm-label">사진 첨부하기</span></div>
                    <div className="qm-row"><span className="q-check i2">✓</span><span className="qm-label">오늘 기록 작성하기</span></div>
                    <div className="qm-row"><span className="q-check i3">✓</span><span className="qm-label">성장앨범에 저장하기</span></div>
                    <div className="qm-progress"><div className="qm-progress-fill" /></div>
                    <div className="qm-badge">오늘의 기록 완료!</div>
                  </div>
                </div>
              </div>
              <div className="tl-text">
                <div className="tl-time">EVENING · 21:00</div>
                <div className="tl-title">오늘 하루,<br />일기로 남겨요</div>
                <p className="tl-desc">사진과 짧은 기록으로 아이의 하루를 남기고, 성장 앨범으로 차곡차곡 모아요.</p>
                <div className="tl-chips"><span>사진 기록</span><span>성장 앨범</span><span>가족 공유</span></div>
              </div>
            </div>
          </div>

          <div className="tl-panel">
            <div className="tl-card">
              <div className="tl-media quest-media">
                <div className="quest-mock">
                  <div className="quest-mock-bar"><span className="qm-dot" /><span className="qm-dot" /><span className="qm-dot" /></div>
                  <div className="quest-mock-body">
                    <div className="qm-title">오늘 밤 AI동화 만들기</div>
                    <div className="qm-row"><span className="q-check i1">✓</span><span className="qm-label">아이 이름 입력하기</span></div>
                    <div className="qm-row"><span className="q-check i2">✓</span><span className="qm-label">오늘의 주제 고르기</span></div>
                    <div className="qm-row"><span className="q-check i3">✓</span><span className="qm-label">AI가 동화 생성하기</span></div>
                    <div className="qm-progress"><div className="qm-progress-fill" /></div>
                    <div className="qm-badge">오늘의 동화 완성!</div>
                  </div>
                </div>
              </div>
              <div className="tl-text">
                <div className="tl-time">NIGHT · 23:00</div>
                <div className="tl-title">잠들기 전,<br />AI가 동화를 들려줘요</div>
                <p className="tl-desc">아이 이름과 취향을 담은 맞춤 동화를 AI가 만들어, 편안한 밤 인사를 건네요.</p>
                <div className="tl-chips"><span>맞춤 동화 생성</span><span>음성 읽어주기</span><span>자장가 모드</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="tl-progress">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span className={`tl-dot${i === 0 ? " active" : ""}`} data-p={i} key={i} />
          ))}
        </div>
        <button type="button" className="tl-arrow tl-arrow-prev" id="tlArrowPrev" aria-label="이전 순간">
          <svg viewBox="0 0 24 24" width="22" height="22"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button type="button" className="tl-arrow tl-arrow-next" id="tlArrowNext" aria-label="다음 순간">
          <svg viewBox="0 0 24 24" width="22" height="22"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
    </section>
  );
};

export default LandingTimeline;
