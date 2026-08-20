import { Link, useLocation } from "react-router-dom";
import useCustomLogin from "../../hooks/useCustomLogin";
import "../../styles/market.css";

export const LINKS = [
  { label: "홈", to: "/market" },
  { label: "매물 등록", to: "/market/write" },
  { label: "내 매물", to: "/market/my-items" },
  { label: "채팅", to: "/market/chat" },
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
