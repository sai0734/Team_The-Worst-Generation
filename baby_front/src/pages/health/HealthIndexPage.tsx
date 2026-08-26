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

const layoutStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "220px 1fr",
  gap: 24,
  alignItems: "start",
};

const navStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  background: "var(--glass)",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius, 24px)",
  padding: 14,
  backdropFilter: "blur(15px)",
  boxShadow: "0 18px 55px rgba(0, 45, 90, 0.08)",
  position: "sticky",
  top: "clamp(38px, 5vh, 68px)",
};

const navItemStyle = (active: boolean, disabled: boolean): CSSProperties => ({
  padding: "12px 14px",
  borderRadius: 14,
  fontSize: 14,
  fontWeight: 700,
  color: disabled ? "var(--line)" : active ? "var(--accent)" : "var(--muted)",
  background: active && !disabled ? "var(--soft)" : "transparent",
  cursor: disabled ? "not-allowed" : "pointer",
});

const navSectionLabelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "var(--muted)",
  padding: "4px 14px 2px",
};

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

        let resolved: BabyInfo | null;
        if (matched) {
          resolved = matched;
        } else if (list.length === 1) {
          // 아이가 한 명뿐이면 고를 필요가 없으니 자동 선택
          resolved = list[0];
        } else {
          // 여러 명일 땐 직접 선택하기 전까지 검사로 못 들어가게 막음
          resolved = null;
        }
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

        <div style={layoutStyle}>
          <nav style={navStyle}>
            <span style={navSectionLabelStyle}>아이별 관리</span>
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
      </div>
    </BasicLayout>
  );
};

export default HealthIndexPage;
