import { useState } from "react";
import { Link } from "react-router-dom";

interface SubItem {
  label: string;
  to: string;
}

interface RailItem {
  code: string;
  label: string;
  icon: string;
  to: string;
  subTitle: string;
  subItems: SubItem[];
}

// TODO: babyInfo/hospital/ai 쪽 실제 라우트 확정되면 to 값 다시 확인해주세요 (README 참고)
const RAIL_ITEMS: RailItem[] = [
  {
    code: "01 · BABY",
    label: "응애관리",
    icon: "📈",
    to: "/babyInfo",
    subTitle: "BABY",
    subItems: [{ label: "대시보드", to: "/babyInfo" }],
  },
  {
    code: "02 · MARKET",
    label: "감자마켓",
    icon: "🥕",
    to: "/market",
    subTitle: "MARKET",
    subItems: [
      { label: "홈", to: "/market" },
      { label: "매물 등록", to: "/market/write" },
      { label: "내 찜", to: "/market/wish" },
      { label: "채팅목록", to: "/market/chat" },
      { label: "마이페이지", to: "/market/mypage" },
    ],
  },
  {
    code: "03 · MEDICAL",
    label: "병원",
    icon: "🏥",
    to: "/hospital",
    subTitle: "MEDICAL",
    subItems: [{ label: "병원 찾기", to: "/hospital" }],
  },
  {
    code: "04 · COMMUNITY",
    label: "커뮤니티",
    icon: "💬",
    to: "/community",
    subTitle: "COMMUNITY",
    subItems: [
      { label: "게시판", to: "/community" },
      { label: "베이비시터", to: "/community/babysitter" },
    ],
  },
  {
    code: "05 · AI SERVICE",
    label: "AI 기능",
    icon: "✦",
    to: "/ai",
    subTitle: "AI SERVICE",
    subItems: [
      { label: "울음소리 분석", to: "/ai/cry-check" },
      { label: "성분표 검사", to: "/ai/allergy" },
    ],
  },
];

const SideRailMenu = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className={`rail-dock${open ? " open" : ""}`}>
      <aside className="rail">
        {RAIL_ITEMS.map((item) => (
          <div className="rail-item" key={item.label}>
            <Link className="move" to={item.to}>
              <span>
                <small>{item.code}</small>
                <strong>{item.label}</strong>
              </span>
              <span>
                <i>{item.icon}</i>
                <em>→</em>
              </span>
            </Link>
            <div className="flyout">
              <div className="flyout-title">{item.subTitle}</div>
              {item.subItems.map((sub) => (
                <Link key={sub.to} to={sub.to}>
                  {sub.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </aside>

      <button
        type="button"
        className="rail-handle"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>MENU</span>
      </button>
    </div>
  );
};

export default SideRailMenu;
