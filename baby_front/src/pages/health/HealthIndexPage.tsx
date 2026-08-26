import { useEffect, useState, type CSSProperties } from "react";
import {
  Outlet,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import BasicLayout from "../../layouts/BasicLayout";
import SkyBackground from "../../components/common/SkyBackground";
import * as babyInfoApi from "../../api/babyInfoApi";
import type { BabyInfo } from "../../api/babyInfoApi";

type HealthAction = "skin" | "stool";

const SIDE_ITEMS: { label: string; action: HealthAction }[] = [
  { label: "피부 검사", action: "skin" },
  { label: "대변 검사", action: "stool" },
];

const navRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 8,
  background: "var(--glass)",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius, 24px)",
  padding: 10,
  backdropFilter: "blur(15px)",
  boxShadow: "0 18px 55px rgba(0, 45, 90, 0.08)",
  position: "sticky",
  top: "clamp(38px, 5vh, 68px)",
  zIndex: 3,
};

const navItemStyle = (active: boolean, disabled: boolean): CSSProperties => ({
  padding: "10px 16px",
  borderRadius: 999,
  fontSize: 14,
  fontWeight: 700,
  whiteSpace: "nowrap",
  color: disabled ? "var(--line)" : active ? "#fff" : "var(--muted)",
  background: active && !disabled ? "var(--accent)" : "transparent",
  cursor: disabled ? "not-allowed" : "pointer",
});

const contentStyle: CSSProperties = {
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: 20,
};

const babyPickerRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

const babyPickerBtnStyle = (active: boolean): CSSProperties => ({
  padding: "8px 16px",
  borderRadius: 999,
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  border: active ? "none" : "1px solid rgba(42,41,38,0.15)",
  background: active ? "#5AB2FF" : "#fff",
  color: active ? "#fff" : "#2A2926",
});

const HealthIndexPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { babyNo } = useParams<{ babyNo: string }>();
  const [searchParams] = useSearchParams();
  const effectiveBabyNo = babyNo ?? searchParams.get("babyNo") ?? undefined;

  const [babyList, setBabyList] = useState<BabyInfo[]>([]);
  const [selectedBaby, setSelectedBaby] = useState<BabyInfo | null>(null);

  useEffect(() => {
    babyInfoApi
      .getList()
      .then((list: BabyInfo[]) => {
        setBabyList(list);

        if (list.length === 0) {
          alert("등록된 아이가 없습니다. 먼저 아이를 등록해주세요.");
          return;
        }

        const matched = effectiveBabyNo
          ? list.find((baby) => String(baby.babyNo) === effectiveBabyNo)
          : undefined;

        // 여러 명이어도 일단 첫 번째 아이로 바로 들어가고, 다른 아이는 위 선택 버튼으로 바꾸면 됨
        const resolved = matched ?? list[0];
        setSelectedBaby(resolved);

        // 서브메뉴로 바로 들어온 경우(=/health 그 자체) 사이드바 첫 탭으로 자동 이동.
        // 단, 아이가 확정된 경우에만 - 여러 명이라 아직 못 고른 상태에서는 이동시키지 않음
        const isBareIndex = location.pathname.replace(/\/$/, "") === "/health";
        if (isBareIndex && resolved?.babyNo !== undefined) {
          navigate(
            { pathname: `${SIDE_ITEMS[0].action}/${resolved.babyNo}` },
            { replace: true },
          );
        }
      })
      .catch((err) => {
        console.error(err);
        alert("아이 목록을 불러오지 못했습니다. 다시 로그인해주세요.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveBabyNo]);

  const handleSelectBaby = (baby: BabyInfo) => {
    setSelectedBaby(baby);

    const currentAction = SIDE_ITEMS.find((item) =>
      location.pathname.includes(`/health/${item.action}/`),
    )?.action;

    if (currentAction && baby.babyNo !== undefined) {
      navigate({ pathname: `${currentAction}/${baby.babyNo}` });
    }
  };

  const goWithBaby = (path: HealthAction) => {
    if (!selectedBaby?.babyNo) {
      alert("먼저 검사할 아이를 선택해주세요.");
      return;
    }
    navigate({ pathname: `${path}/${selectedBaby.babyNo}` });
  };

  const isActionActive = (action: HealthAction) =>
    location.pathname.includes(`/health/${action}/`);

  const activeLabel =
    SIDE_ITEMS.find((item) => isActionActive(item.action))?.label ??
    "건강 체크";
  const pageTitle = selectedBaby
    ? `${selectedBaby.babyName}의 ${activeLabel}`
    : activeLabel;

  return (
    <BasicLayout>
      <SkyBackground />
      <div
        className="page-sky-content"
        style={{ display: "flex", flexDirection: "column", gap: 20 }}
      >
        {babyList.length > 1 && (
          <div style={babyPickerRowStyle}>
            {babyList.map((baby) => (
              <button
                key={baby.babyNo}
                type="button"
                style={babyPickerBtnStyle(baby.babyNo === selectedBaby?.babyNo)}
                onClick={() => handleSelectBaby(baby)}
              >
                {baby.babyName}
              </button>
            ))}
          </div>
        )}

        <h1 className="page-hero-title">{pageTitle}</h1>

        <nav style={navRowStyle}>
          {SIDE_ITEMS.map((item) => (
            <span
              key={item.action}
              style={navItemStyle(isActionActive(item.action), !selectedBaby)}
              onClick={() => goWithBaby(item.action)}
            >
              {item.label}
            </span>
          ))}
        </nav>

        <div style={contentStyle}>
          <Outlet />
        </div>
      </div>
    </BasicLayout>
  );
};

export default HealthIndexPage;
