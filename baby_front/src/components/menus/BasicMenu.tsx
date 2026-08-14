import { useState, type MouseEvent } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import type { RootState } from "../../store";
import { triggerWipe } from "../../utils/pageTransition";

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
      { label: "내 찜", to: "/market/wish" },
      { label: "채팅목록", to: "/market/chat" },
      { label: "마이페이지", to: "/market/mypage" },
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
  const [hovered, setHovered] = useState<string | null>(null);
  const navigate = useNavigate();

  const activeItem = NAV_ITEMS.find((item) => item.code === hovered);

  const wipeTo = (to: string) => (e: MouseEvent) => {
    e.preventDefault();
    setHovered(null);
    triggerWipe(() => navigate(to));
  };

  return (
    <>
      <header className="top-wrap" onMouseLeave={() => setHovered(null)}>
        <div className="top">
          <Link className="logo" to="/" onClick={wipeTo("/")}>
            <b>아이봄</b>
          </Link>

          <nav className="primary-nav">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.code}
                to={item.to}
                className="nav-tab"
                onMouseEnter={() => setHovered(item.code)}
                onClick={wipeTo(item.to)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="top-right">
            <div className="account">
              <Link to="/mypage">마이페이지</Link>
              {loginState.email ? (
                <Link to="/member/logout">로그아웃</Link>
              ) : (
                <Link to="/member/login">로그인</Link>
              )}
            </div>
          </div>
        </div>

        <div className={`subnav${activeItem ? " open" : ""}`}>
          {activeItem?.subItems.map((sub, idx) => (
            <span className="subnav-item" key={sub.to}>
              {idx > 0 && <i className="subnav-divider" />}
              <Link to={sub.to} onClick={wipeTo(sub.to)}>
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
