import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

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
  to: string;
  active?: boolean;
}

const FEATURE_PANELS: FeaturePanel[] = [
  {
    bg: "https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=1200&q=70",
    num: "01.", title: "AI 리콜", lead: "육아용품 안전, 놓치지 않게",
    desc: "보유 육아용품을 리콜·유해 이슈 DB와 자동 매칭하고, 가족 보드와 푸시로 즉시 알려줍니다.",
    // 리콜은 별도 소개 페이지가 없어서 대시보드의 리콜 카드 위치로 스크롤 이동
    to: "/dashboard#dashboard-recall",
    active: true,
  },
  {
    bg: "https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&w=1200&q=70",
    num: "02.", title: "응애 관리", lead: "수유·수면·배변을 함께",
    desc: "가족의 기록이 실시간으로 공유되어, 누구든 지금 아이 상태를 바로 확인할 수 있습니다.",
    to: "/babyInfo",
  },
  {
    bg: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=1200&q=70",
    num: "03.", title: "감자마켓", lead: "육아용품 나눔·거래",
    desc: "우리 동네 부모들과 안전하게 연결해, 필요한 용품을 나누고 거래합니다.",
    to: "/market",
  },
  {
    bg: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=70",
    num: "04.", title: "병원", lead: "가까운 소아과·응급",
    desc: "지금 당장 필요한 병원을 빠르게 찾고, 응급 상황에도 바로 연결할 수 있습니다.",
    to: "/hospital",
  },
  {
    bg: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=70",
    num: "05.", title: "AI 정부지원금", lead: "놓치기 쉬운 지원, AI가 찾아요",
    desc: "가구·아이 정보에 맞는 정부지원금을 추천하고, 신청 가능한 혜택을 한곳에 모아 보여줍니다.",
    // 정부지원금도 별도 페이지가 없어서 대시보드의 AI 정부지원금 패널 위치로 스크롤 이동
    to: "/dashboard#dashboard-subsidy",
  },
  {
    bg: "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?auto=format&fit=crop&w=1200&q=70",
    num: "06.", title: "커뮤니티", lead: "부모들의 이야기",
    desc: "수면·이유식·일상 팁을 나누고, 같은 시기를 지나가는 부모들과 연결됩니다.",
    to: "/community",
  },
];

const LandingFeatures = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // 기능 카드 — hover로 미리보기, 클릭하면 해당 기능 위치로 이동
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const acc = root.querySelector<HTMLElement>("#feature-acc");
    const section = root.querySelector<HTMLElement>("#featuresSection");
    if (!acc || !section) return;
    const panels = [...acc.querySelectorAll<HTMLElement>(".h-acc-panel")];
    const pinnedIdx = FEATURE_PANELS.findIndex((p) => p.active);

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
      const onLeave = () => activate(pinnedIdx);
      const onFocus = () => activate(i);
      const onClick = () => navigate(FEATURE_PANELS[i].to);
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
  }, [navigate]);

  return (
    <div className="features-wrap" ref={rootRef}>
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
  );
};

export default LandingFeatures;
