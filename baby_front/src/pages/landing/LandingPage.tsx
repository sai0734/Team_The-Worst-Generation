import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./landing.css";
import LandingHero from "./LandingHero";
import LandingTimeline from "./LandingTimeline";
import LandingFeatures from "./LandingFeatures";
import LandingStory from "./LandingStory";

const LandingPage = () => {
  const rootRef = useRef<HTMLDivElement>(null);

  // react-router는 페이지 이동 시 스크롤 위치를 초기화해주지 않아서, 다른 페이지를 스크롤한 채로
  // 이 페이지에 들어오면 남아있던 scrollY 때문에 하루사이클 인트로가 위치 판정을 잘못해 애니메이션 없이
  // 곧장 최종 상태로 나타나 보였음 — 마운트 시 항상 맨 위로 리셋.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // 파트 경계 스냅: 파트1(히어로)↔파트2(하루사이클), 파트3(기능)↔파트4(후기·FAQ·퀵스타트) 경계에서만
  // 마우스 스크롤 한 번에 다음/이전 파트 시작 지점으로 부드럽게 이동. 파트2·파트4 내부의
  // 기존 스크롤 연동 애니메이션(하루사이클 화살표, 후기→FAQ→퀵스타트 전환)은 그대로 유지.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const timelineEl = root.querySelector<HTMLElement>("#timelineWrap");
    const featuresWrapEl = root.querySelector<HTMLElement>(".features-wrap");
    const storyEl = root.querySelector<HTMLElement>("#reviewsSection");
    if (!timelineEl || !featuresWrapEl || !storyEl) return;

    const isDesktop = () => window.matchMedia("(min-width: 901px)").matches;
    let animating = false;

    const smoothScrollTo = (top: number) => {
      animating = true;
      window.scrollTo({ top, behavior: "smooth" });
      window.setTimeout(() => {
        animating = false;
      }, 700);
    };

    const onWheel = (e: WheelEvent) => {
      if (!isDesktop() || animating) return;

      const y = window.scrollY;
      const heroEnd = timelineEl!.offsetTop;
      const featuresStart = featuresWrapEl!.offsetTop;
      const storyStart = storyEl!.offsetTop;
      // 파트2(하루사이클)는 인트로가 끝난 뒤부터만 스냅 대상 — 인트로 재생 중엔
      // LandingTimeline 자체 wheel 핸들러가 스크롤을 막고 인트로를 스킵시키므로 손대지 않음.
      const timelineReady = timelineEl!.classList.contains("intro-settled");

      // 스크롤 한 번으로 구간 전체를 위/아래 어디서든 통째로 넘어가는 "단일 페이지" 구간들.
      // 파트4(후기·FAQ·퀵스타트)는 내부에 스크롤 연동 전환이 있어서 이 목록에 넣지 않고
      // 진입/이탈 경계만 아래에서 따로 처리함.
      const zones: Array<[start: number, end: number, ready: boolean]> = [
        [0, heroEnd, true],                        // 파트1 히어로
        [heroEnd, featuresStart, timelineReady],   // 파트2 하루사이클
        [featuresStart, storyStart, true],         // 파트3 기능 아코디언
      ];

      for (const [start, end, ready] of zones) {
        if (!ready) continue;
        if (y >= start - 1 && y < end - 1 && e.deltaY > 0) {
          e.preventDefault();
          smoothScrollTo(end);
          return;
        }
        if (y > start + 1 && y <= end + 1 && e.deltaY < 0) {
          e.preventDefault();
          smoothScrollTo(start);
          return;
        }
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div className="landing-page landing-nav-height" ref={rootRef}>
      <LandingHero />
      <LandingTimeline />
      <LandingFeatures />
      <LandingStory />

      <footer className="site-footer">
        <div className="footer-cta">
          <h3>지금, 아이봄과 하루를 시작해보세요</h3>
          <a className="btn" href="#timelineWrap">지금 시작하기</a>
        </div>

        <div className="footer-nav">
          <div className="footer-nav-col">
            <p className="footer-nav-title">서비스</p>
            <Link to="/babyInfo">응애관리</Link>
            <Link to="/diary">육아일기</Link>
            <Link to="/ledger">가계부</Link>
            <Link to="/market">감자마켓</Link>
            <Link to="/hospital">병원</Link>
            <Link to="/community">커뮤니티</Link>
          </div>
          <div className="footer-nav-col">
            <p className="footer-nav-title">AI 기능</p>
            <Link to="/ai/behavior">행동교정 상담</Link>
            <Link to="/ai/cry-check">울음소리 분석</Link>
            <Link to="/ai/story">맞춤 동화 생성</Link>
            <Link to="/walk">산책로 추천</Link>
            <Link to="/allergy">성분표 검사</Link>
            <Link to="/health">건강 체크</Link>
          </div>
          <div className="footer-nav-col">
            <p className="footer-nav-title">계정</p>
            <Link to="/member/login">로그인</Link>
            <Link to="/member/signup">회원가입</Link>
            <Link to="/mypage">마이페이지</Link>
          </div>
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
