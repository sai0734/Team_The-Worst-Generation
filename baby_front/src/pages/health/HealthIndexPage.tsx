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

const navDividerStyle: CSSProperties = {
  height: 1,
  background: "var(--line)",
  margin: "6px 4px",
};

const contentStyle: CSSProperties = {
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: 20,
};

const babyPickerListStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  padding: "0 4px",
};

const babyPickBtnStyle: CSSProperties = {
  padding: "8px 14px",
  borderRadius: 14,
  border: "1px solid var(--line)",
  background: "var(--glass)",
  color: "var(--ink)",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
};

const selectedBabyRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px 14px",
};

const selectedBabyNameStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "var(--ink)",
};

const changeBabyBtnStyle: CSSProperties = {
  border: "none",
  background: "none",
  color: "var(--accent)",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

const HealthIndexPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { babyNo } = useParams<{ babyNo: string }>();
  const [searchParams] = useSearchParams();
  const effectiveBabyNo = babyNo ?? searchParams.get("babyNo") ?? undefined;

  const [babyList, setBabyList] = useState<BabyInfo[]>([]);
  const [selectedBaby, setSelectedBaby] = useState<BabyInfo | null>(null);
  const [pickerOpen, setPickerOpen] = useState(true);

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

        if (matched) {
          setSelectedBaby(matched);
          setPickerOpen(false);
        } else if (list.length === 1) {
          setSelectedBaby(list[0]);
          setPickerOpen(false);
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
    setPickerOpen(false);

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

  return (
    <BasicLayout>
      <SkyBackground />
      <div style={layoutStyle} className="page-sky-content">
        <nav style={navStyle}>
          <span style={navSectionLabelStyle}>검사할 아이</span>
          {pickerOpen || !selectedBaby ? (
            <div style={babyPickerListStyle}>
              {babyList.map((baby) => (
                <button
                  key={baby.babyNo}
                  type="button"
                  style={babyPickBtnStyle}
                  onClick={() => handleSelectBaby(baby)}
                >
                  {baby.babyName}
                </button>
              ))}
            </div>
          ) : (
            <div style={selectedBabyRowStyle}>
              <span style={selectedBabyNameStyle}>{selectedBaby.babyName}</span>
              <button
                type="button"
                style={changeBabyBtnStyle}
                onClick={() => setPickerOpen(true)}
              >
                변경
              </button>
            </div>
          )}

          <div style={navDividerStyle} />
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
    </BasicLayout>
  );
};

export default HealthIndexPage;
