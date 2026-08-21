import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import useCurrentProfile from "../../hooks/useCurrentProfile";
import useCustomLogin from "../../hooks/useCustomLogin";
import useHomeCamMonitor from "../../hooks/useHomeCamMonitor";
import { homeCamMonitor } from "../../util/homeCamMonitor";
import type { RootState } from "../../store";
import HomeCamModal from "./HomeCamModal";
import "../../styles/homecam.css";

interface SubItem {
  label: string;
  to: string;
}

interface NavItem {
  code: string;
  label: string;
  to: string;
  subItems: SubItem[];
}

const NAV_ITEMS: NavItem[] = [
  {
    code: "home",
    label: "홈",
    to: "/",
    subItems: [
      { label: "메인", to: "/" },
      { label: "대시보드", to: "/dashboard" },
    ],
  },
  {
    code: "baby",
    label: "응애관리",
    to: "/babyInfo",
    subItems: [
      { label: "우리아이", to: "/babyInfo" },
      { label: "육아일기", to: "/diary" },
    ],
  },
  {
    code: "ledger",
    label: "가계부",
    to: "/ledger",
    subItems: [{ label: "가계부 홈", to: "/ledger" }],
  },
  {
    code: "market",
    label: "감자마켓",
    to: "/market",
    subItems: [
      { label: "홈", to: "/market" },
      { label: "매물 등록", to: "/market/write" },
      { label: "내 매물", to: "/market/my-items" },
      { label: "채팅목록", to: "/market/chat" },
    ],
  },
  {
    code: "hospital",
    label: "병원",
    to: "/hospital",
    subItems: [{ label: "병원 찾기", to: "/hospital" }],
  },
  {
    code: "community",
    label: "커뮤니티",
    to: "/community",
    subItems: [
      { label: "게시판", to: "/community" },
      { label: "베이비시터", to: "/community/babysitter" },
    ],
  },
  {
    code: "ai",
    label: "AI 기능",
    to: "/ai",
    subItems: [
      { label: "울음소리 분석", to: "/ai/cry-check" },
      { label: "성분표 검사", to: "/allergy" },
      { label: "산책로 추천", to: "/walk" },
      { label: "건강 체크", to: "/health" },
    ],
  },
];

const BasicMenu = () => {
  const loginState = useSelector((state: RootState) => state.loginSlice);
  const currentProfile = useCurrentProfile();
  const { doLogout, moveToPath } = useCustomLogin();
  const [hovered, setHovered] = useState<string | null>(null);
  const [subnavLeft, setSubnavLeft] = useState<number | undefined>(undefined);
  const topWrapRef = useRef<HTMLElement | null>(null);
  const tabRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  const activeItem = NAV_ITEMS.find((item) => item.code === hovered);
  const closeSubnav = () => setHovered(null);

  // 좁은 화면에서는 상단 탭(.primary-nav)이 숨겨지므로 햄버거 버튼으로 대체 메뉴를 연다.
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  const closeMobileNav = () => {
    setMobileNavOpen(false);
    setMobileExpanded(null);
  };
  const toggleMobileNav = () => setMobileNavOpen((prev) => !prev);
  const toggleMobileExpand = (code: string) =>
    setMobileExpanded((prev) => (prev === code ? null : code));

  const handleLogout = () => {
    doLogout();
    moveToPath("/");
  };

  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [isHomeCamOpen, setIsHomeCamOpen] = useState(false);
  const { isMonitoring, isAlertActive } = useHomeCamMonitor();

  // 홈캠을 안 보고 있어도(감시만 켜둔 상태) 안전영역 이탈이 감지되면 화면을 강제로 띄움
  useEffect(() => {
    if (isAlertActive) {
      setIsHomeCamOpen(true);
    }
  }, [isAlertActive]);

  const handleTabEnter = (code: string) => {
    setHovered(code);
    const tabEl = tabRefs.current[code];
    const wrapEl = topWrapRef.current;
    if (tabEl && wrapEl) {
      const tabRect = tabEl.getBoundingClientRect();
      const wrapRect = wrapEl.getBoundingClientRect();
      setSubnavLeft(tabRect.left - wrapRect.left);
    }
  };

  useEffect(() => {
    if (!isSosModalOpen) return;

    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsSosModalOpen(false);
    };

    window.addEventListener("keydown", closeWithEscape);
    return () => window.removeEventListener("keydown", closeWithEscape);
  }, [isSosModalOpen]);

  const toggleMonitoring = () => {
    if (isMonitoring) {
      homeCamMonitor.stopMonitoring();
    } else {
      homeCamMonitor.startMonitoring();
    }
  };

  return (
    <>
      <header
        className="top-wrap"
        ref={topWrapRef}
        onMouseLeave={() => setHovered(null)}
      >
        <div className="top">
          <Link className="logo" to="/" onClick={closeSubnav}>
            <b>아이봄</b>
          </Link>

          <nav className="primary-nav">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.code}
                to={item.to}
                className="nav-tab"
                ref={(el) => {
                  tabRefs.current[item.code] = el;
                }}
                onMouseEnter={() => handleTabEnter(item.code)}
                onClick={closeSubnav}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="top-right">
            <button
              type="button"
              className="hamburger-btn"
              aria-label="메뉴 열기"
              aria-haspopup="true"
              aria-expanded={mobileNavOpen}
              onClick={toggleMobileNav}
            >
              <span />
              <span />
              <span />
            </button>

            <div className="account">
              {loginState.email ? (
                <>
                  <Link
                    className="current-profile-link"
                    to="/member/profiles"
                    aria-label="현재 프로필 변경"
                  >
                    <span className="current-profile-dot" aria-hidden="true" />
                    <span className="current-profile-copy">
                      <small>현재 프로필</small>
                      <strong>
                        {currentProfile?.profileName ?? "프로필 선택"}
                      </strong>
                    </span>
                  </Link>
                  <Link className="account-link" to="/mypage">
                    마이페이지
                  </Link>
                  <button
                    type="button"
                    className="account-primary"
                    onClick={handleLogout}
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <Link className="account-primary" to="/member/login">
                  로그인
                </Link>
              )}
            </div>
          </div>
        </div>

        <div
          className={`subnav${activeItem ? " open" : ""}`}
          style={{ paddingLeft: subnavLeft }}
        >
          {activeItem?.subItems.map((sub, idx) => (
            <span className="subnav-item" key={sub.to}>
              {idx > 0 && <i className="subnav-divider" />}
              <Link to={sub.to} onClick={closeSubnav}>
                {sub.label}
              </Link>
            </span>
          ))}
        </div>
      </header>

      {mobileNavOpen && (
        <>
          <div className="mobile-nav-backdrop" onClick={closeMobileNav} />
          <nav className="mobile-nav-panel" aria-label="모바일 메뉴">
            {NAV_ITEMS.map((item) => (
              <div className="mobile-nav-item" key={item.code}>
                <div className="mobile-nav-row">
                  <Link
                    to={item.to}
                    className="mobile-nav-label"
                    onClick={closeMobileNav}
                  >
                    {item.label}
                  </Link>
                  {item.subItems.length > 1 && (
                    <button
                      type="button"
                      className={`mobile-nav-toggle${mobileExpanded === item.code ? " open" : ""}`}
                      aria-label={`${item.label} 하위 메뉴 펼치기`}
                      aria-expanded={mobileExpanded === item.code}
                      onClick={() => toggleMobileExpand(item.code)}
                    >
                      ▾
                    </button>
                  )}
                </div>
                {item.subItems.length > 1 && mobileExpanded === item.code && (
                  <div className="mobile-nav-sub">
                    {item.subItems.map((sub) => (
                      <Link key={sub.to} to={sub.to} onClick={closeMobileNav}>
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </>
      )}

      <div className="floating-tools">
        <button
          type="button"
          className="tool tool--sos"
          aria-label="긴급 도움 요청"
          aria-haspopup="dialog"
          aria-expanded={isSosModalOpen}
          onClick={() => setIsSosModalOpen(true)}
        >
          <i aria-hidden="true">!</i>
          <span>SOS</span>
        </button>
        <button
          type="button"
          className="tool"
          onClick={() => window.dispatchEvent(new Event("open-chatbot"))}
        >
          <i>💬</i>
          <span>AI 챗봇</span>
        </button>
        <button
          type="button"
          className={`tool tool--monitor${isMonitoring ? " is-active" : ""}`}
          aria-pressed={isMonitoring}
          title="AI가 화면에서 빠른 움직임을 감지하면 알림을 드려요. (이 사이트가 켜져 있는 동안만 동작해요)"
          onClick={toggleMonitoring}
        >
          <i>{isMonitoring ? "👁️" : "🚫"}</i>
          <span>{isMonitoring ? "감시 중지" : "감시 시작"}</span>
          {isMonitoring && <b className="live"></b>}
        </button>
        <button
          type="button"
          className="tool"
          aria-haspopup="dialog"
          aria-expanded={isHomeCamOpen}
          onClick={() => setIsHomeCamOpen(true)}
        >
          <i>📹</i>
          <span>홈캠</span>
          {isMonitoring && <b className="live"></b>}
        </button>
      </div>

      {isHomeCamOpen && (
        <HomeCamModal onClose={() => setIsHomeCamOpen(false)} />
      )}

      {isSosModalOpen && (
        <div
          className="sos-modal-backdrop"
          role="presentation"
          onMouseDown={() => setIsSosModalOpen(false)}
        >
          <section
            className="sos-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sos-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <span className="sos-modal__icon" aria-hidden="true">
              !
            </span>
            <h2 id="sos-modal-title">응급 요청을 하시겠습니까?</h2>
            <p>잘못 누르셨다면 취소를 선택해주세요.</p>
            <div className="sos-modal__actions">
              <button
                type="button"
                className="sos-modal__cancel"
                onClick={() => setIsSosModalOpen(false)}
              >
                취소
              </button>
              <button
                type="button"
                className="sos-modal__confirm"
                onClick={() => setIsSosModalOpen(false)}
              >
                응급 요청하기
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
};

export default BasicMenu;
