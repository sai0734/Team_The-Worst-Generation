import { useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import useCurrentProfile from "../../hooks/useCurrentProfile";
import type { RootState } from "../../store";

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
    to: "/main",
    subItems: [
      { label: "메인", to: "/main" },
      { label: "대시보드", to: "/dashboard" },
    ],
  },
  {
    code: "baby",
    label: "응애관리",
    to: "/babyInfo",
    subItems: [
      { label: "아이등록", to: "/babyInfo/input" },
      { label: "대시보드", to: "/babyInfo" },
      { label: "육아일기", to: "/diary" },
      { label: "성장앨범", to: "/album" },
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
      { label: "성분표 검사", to: "/ai/allergy" },
    ],
  },
];

const BasicMenu = () => {
  const loginState = useSelector((state: RootState) => state.loginSlice);
  const currentProfile = useCurrentProfile();
  const [hovered, setHovered] = useState<string | null>(null);
  const [subnavLeft, setSubnavLeft] = useState<number | undefined>(undefined);
  const topWrapRef = useRef<HTMLElement | null>(null);
  const tabRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  const activeItem = NAV_ITEMS.find((item) => item.code === hovered);
  const closeSubnav = () => setHovered(null);

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

  return (
    <>
      <header className="top-wrap" ref={topWrapRef} onMouseLeave={() => setHovered(null)}>
        <div className="top">
          <Link className="logo" to="/main" onClick={closeSubnav}>
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
            <div className="account">
              {loginState.email ? (
                <>
                  <Link className="current-profile-link" to="/member/profiles" aria-label="현재 프로필 변경">
                    <span className="current-profile-dot" aria-hidden="true" />
                    <span className="current-profile-copy">
                      <small>현재 프로필</small>
                      <strong>{currentProfile?.profileName ?? "프로필 선택"}</strong>
                    </span>
                  </Link>
                  <Link className="account-link" to="/mypage">마이페이지</Link>
                  <Link className="account-primary" to="/member/logout">로그아웃</Link>
                </>
              ) : (
                <Link className="account-primary" to="/member/login">로그인</Link>
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

      <div className="floating-tools">
        <button
          type="button"
          className="tool"
          onClick={() => window.dispatchEvent(new Event("open-chatbot"))}
        >
          <i>💬</i>
          <span>AI 챗봇</span>
        </button>
        <button type="button" className="tool">
          <i>📹</i>
          <span>홈캠</span>
          <b className="live"></b>
        </button>
      </div>
    </>
  );
};

export default BasicMenu;
