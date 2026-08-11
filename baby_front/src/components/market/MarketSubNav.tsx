import { Link, useLocation } from "react-router-dom";
import useCustomLogin from "../../hooks/useCustomLogin";

const LINKS = [
  { label: "홈", to: "/market" },
  { label: "매물 등록", to: "/market/write" },
  { label: "내 찜", to: "/market/wish" },
  { label: "채팅", to: "/market/chat" },
  { label: "내 감자밭", to: "/market/mypage" },
];

const MarketSubNav = () => {
  const { isLogin } = useCustomLogin();
  const location = useLocation();

  if (!isLogin) {
    return null;
  }

  return (
    <nav className="market-subnav">
      {LINKS.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className={location.pathname === link.to ? "active" : ""}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
};

export default MarketSubNav;
