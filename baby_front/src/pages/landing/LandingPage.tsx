import { useEffect, useRef } from "react";
import "./landing.css";

// 밤하늘/베일에 쓰이는 별 63개의 (left%, top%, delay s, duration s) — 두 군데(밤하늘, 인트로 베일)에서 재사용
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

const PlayIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" className="play-ic-svg">
    <path d="M8 5v14l11-7z" fill="currentColor" />
  </svg>
);

interface FeaturePanel {
  bg: string;
  num: string;
  title: string;
  lead: string;
  desc: string;
  active?: boolean;
}

const FEATURE_PANELS: FeaturePanel[] = [
  {
    bg: "https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=1200&q=70",
    num: "01.", title: "AI 리콜", lead: "육아용품 안전, 놓치지 않게",
    desc: "보유 육아용품을 리콜·유해 이슈 DB와 자동 매칭하고, 가족 보드와 푸시로 즉시 알려줍니다.",
    active: true,
  },
  {
    bg: "https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&w=1200&q=70",
    num: "02.", title: "응애 관리", lead: "수유·수면·배변을 함께",
    desc: "가족의 기록이 실시간으로 공유되어, 누구든 지금 아이 상태를 바로 확인할 수 있습니다.",
  },
  {
    bg: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=1200&q=70",
    num: "03.", title: "감자마켓", lead: "육아용품 나눔·거래",
    desc: "우리 동네 부모들과 안전하게 연결해, 필요한 용품을 나누고 거래합니다.",
  },
  {
    bg: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=70",
    num: "04.", title: "병원", lead: "가까운 소아과·응급",
    desc: "지금 당장 필요한 병원을 빠르게 찾고, 응급 상황에도 바로 연결할 수 있습니다.",
  },
  {
    bg: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=70",
    num: "05.", title: "AI 정부지원금", lead: "놓치기 쉬운 지원, AI가 찾아요",
    desc: "가구·아이 정보에 맞는 정부지원금을 추천하고, 신청 가능한 혜택을 한곳에 모아 보여줍니다.",
  },
  {
    bg: "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?auto=format&fit=crop&w=1200&q=70",
    num: "06.", title: "커뮤니티", lead: "부모들의 이야기",
    desc: "수면·이유식·일상 팁을 나누고, 같은 시기를 지나가는 부모들과 연결됩니다.",
  },
];

const REVIEWS = [
  { stars: "★★★★★", text: "\"이유식 성분표 검사 덕분에 알러지 걱정을 덜었어요. 매일 켜는 앱이 됐어요.\"", avatar: "🙋‍♀️", who: "28개월 아이 엄마" },
  { stars: "★★★★★", text: "\"울음소리 분석이 신기할 정도로 잘 맞아요. 초보 부모한테 진짜 도움돼요.\"", avatar: "🙋‍♂️", who: "5개월 아이 아빠" },
  { stars: "★★★★☆", text: "\"감자마켓에서 육아용품 정리하고, 가계부까지 한 번에 관리돼서 편해요.\"", avatar: "🙋‍♀️", who: "14개월 아이 엄마" },
];

const FAQ_ITEMS = [
  { q: "아이봄, 무료로 사용할 수 있나요?", a: "기본 기록·AI 기능은 무료로 제공돼요. 일부 프리미엄 기능은 추후 안내드릴 예정이에요.", open: true },
  { q: "아이 사진과 기록은 안전하게 보관되나요?", a: "모든 데이터는 암호화되어 저장되고, 동의 없이 외부에 공유되지 않아요." },
  { q: "AI 울음소리 분석은 얼마나 정확한가요?", a: "배고픔·졸림·불편함 등 대표적인 패턴을 학습한 모델로, 참고용 가이드로 활용하시길 권장해요." },
  { q: "여러 명이 한 아이 정보를 같이 관리할 수 있나요?", a: "네, 보호자 계정을 연결해서 부모가 함께 기록하고 확인할 수 있어요." },
];

const LandingPage = () => {
  const rootRef = useRef<HTMLDivElement>(null);

  // react-router는 페이지 이동 시 스크롤 위치를 초기화해주지 않아서, 다른 페이지를 스크롤한 채로
  // 이 페이지에 들어오면 남아있던 scrollY 때문에 하루사이클 인트로가 위치 판정을 잘못해 애니메이션 없이
  // 곧장 최종 상태로 나타나 보였음 — 마운트 시 항상 맨 위로 리셋.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
    const wrap = root.querySelector<HTMLElement>("#reviewsSection");
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

  // 2파트: 하루 사이클 (밤→아침 인트로, 시간대별 하늘/태양/구름, 좌우 화살표 이동)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const q = <T extends HTMLElement = HTMLElement>(sel: string) => root.querySelector<T>(sel);
    const qa = <T extends HTMLElement = HTMLElement>(sel: string) => [...root.querySelectorAll<T>(sel)];

    const wrap = q("#timelineWrap");
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

  // 3파트: 기능 카드 — hover로 미리보기, 클릭하면 고정
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const acc = root.querySelector<HTMLElement>("#feature-acc");
    const section = root.querySelector<HTMLElement>("#featuresSection");
    if (!acc || !section) return;
    const panels = [...acc.querySelectorAll<HTMLElement>(".h-acc-panel")];
    let pinnedIdx: number | null = null;

    const activate = (idx: number) => {
      panels.forEach((p, i) => {
        const on = i === idx;
        p.classList.toggle("is-active", on);
        p.setAttribute("aria-selected", on ? "true" : "false");
      });
    };

    const onEnterHandlers: Array<() => void> = [];
    const onLeaveHandlers: Array<() => void> = [];
    const onFocusHandlers: Array<() => void> = [];
    const onClickHandlers: Array<() => void> = [];

    panels.forEach((p, i) => {
      const onEnter = () => activate(i);
      const onLeave = () => activate(pinnedIdx !== null ? pinnedIdx : -1);
      const onFocus = () => activate(i);
      const onClick = () => { pinnedIdx = i; activate(i); };
      onEnterHandlers.push(onEnter);
      onLeaveHandlers.push(onLeave);
      onFocusHandlers.push(onFocus);
      onClickHandlers.push(onClick);
      p.addEventListener("mouseenter", onEnter);
      p.addEventListener("mouseleave", onLeave);
      p.addEventListener("focus", onFocus);
      p.addEventListener("click", onClick);
    });

    let revealTimer: number | null = null;
    const revealStagger = () => {
      panels.forEach((p, i) => { p.style.transitionDelay = i * 0.09 + "s"; });
      acc.classList.add("in-view");
      revealTimer = window.setTimeout(() => {
        panels.forEach((p) => { p.style.transitionDelay = ""; });
      }, 700);
    };

    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            revealStagger();
            io?.unobserve(entry.target);
          }
        });
      }, { threshold: 0.35 });
      io.observe(section);
    } else {
      revealStagger();
    }

    return () => {
      panels.forEach((p, i) => {
        p.removeEventListener("mouseenter", onEnterHandlers[i]);
        p.removeEventListener("mouseleave", onLeaveHandlers[i]);
        p.removeEventListener("focus", onFocusHandlers[i]);
        p.removeEventListener("click", onClickHandlers[i]);
      });
      if (revealTimer) window.clearTimeout(revealTimer);
      io?.disconnect();
    };
  }, []);

  return (
    <div className="landing-page landing-nav-height" ref={rootRef}>
      {/* 1파트: 히어로 */}
      <section className="hero" id="home">
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

      {/* 2파트: 하루 사이클 */}
      <section className="timeline-wrap" id="timelineWrap">
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
            <div className="tl-moon" id="tlMoon" />
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

      {/* 3파트: 기능 아코디언 */}
      <div className="features-wrap">
        <section className="h-acc-section" id="featuresSection">
          <div className="h-acc-heading">
            <h2>MORE</h2>
            <p>그 밖의 아이봄 · 필요한 순간을 챙겨 드립니다</p>
          </div>
          <div className="h-acc" id="feature-acc" role="tablist" aria-label="아이봄 기능">
            {FEATURE_PANELS.map((p) => (
              <button
                type="button"
                className={`h-acc-panel${p.active ? " is-active" : ""}`}
                role="tab"
                aria-selected={p.active ? "true" : "false"}
                key={p.num}
              >
                <span className="h-acc-bg" style={{ backgroundImage: `url('${p.bg}')` }} aria-hidden="true" />
                <span className="h-acc-bar" />
                <span className="h-acc-num">{p.num}</span>
                <span className="h-acc-title">{p.title}</span>
                <div className="h-acc-body">
                  <p className="lead">{p.lead}</p>
                  <p className="h-acc-desc">{p.desc}</p>
                </div>
                <div className="h-acc-video">
                  <video muted loop playsInline />
                  <PlayIcon />
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* 4파트: 후기 / FAQ / 퀵스타트 */}
      <section className="story-merge" id="reviewsSection" data-stage="0">
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

      <footer className="site-footer">
        <div className="footer-cta">
          <h3>지금, 아이봄과 하루를 시작해보세요</h3>
          <a className="btn" href="#timelineWrap">지금 시작하기</a>
        </div>
        <div className="footer-bottom">
          <div className="footer-logo"><b>아이</b>봄</div>
          <div className="footer-links">
            <a href="#">이용약관</a>
            <a href="#">개인정보처리방침</a>
            <a href="#">문의하기</a>
          </div>
          <div className="footer-copy">© 2026 아이봄. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
