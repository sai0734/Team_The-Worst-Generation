import { useCallback, useState, type CSSProperties } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import BasicLayout from "../../layouts/BasicLayout";
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

const navItemStyle = (active: boolean): CSSProperties => ({
  padding: "12px 14px",
  borderRadius: 14,
  fontSize: 14,
  fontWeight: 700,
  color: active ? "var(--accent)" : "var(--muted)",
  background: active ? "var(--soft)" : "transparent",
  cursor: "pointer",
});

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
  marginTop: 10,
};

const babyPickBtnStyle: CSSProperties = {
  padding: "10px 16px",
  borderRadius: 14,
  border: "1px solid var(--line)",
  background: "var(--glass)",
  color: "var(--ink)",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
};

const HealthIndexPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { babyNo } = useParams<{ babyNo: string }>();
  const [babyList, setBabyList] = useState<BabyInfo[] | null>(null);
  const [pendingPath, setPendingPath] = useState<HealthAction | null>(null);

  const goWithBaby = useCallback(
    async (path: HealthAction) => {
      if (babyNo) {
        navigate({ pathname: `${path}/${babyNo}` });
        return;
      }

      const list: BabyInfo[] = await babyInfoApi.getList();

      if (list.length === 0) {
        alert("등록된 아이가 없습니다. 먼저 아이를 등록해주세요.");
        return;
      }

      if (list.length === 1) {
        navigate({ pathname: `${path}/${list[0].babyNo}` });
        return;
      }

      setBabyList(list);
      setPendingPath(path);
    },
    [navigate, babyNo],
  );

  const selectBaby = (selectedBabyNo: number) => {
    if (!pendingPath) return;

    navigate({ pathname: `${pendingPath}/${selectedBabyNo}` });
    setBabyList(null);
    setPendingPath(null);
  };

  const isActionActive = (action: HealthAction) =>
    location.pathname.includes(`/health/${action}/`);

  return (
    <BasicLayout>
      <div style={layoutStyle}>
        <nav style={navStyle}>
          {SIDE_ITEMS.map((item) => (
            <span
              key={item.action}
              style={navItemStyle(isActionActive(item.action))}
              onClick={() => goWithBaby(item.action)}
            >
              {item.label}
            </span>
          ))}
        </nav>

        <div style={contentStyle}>
          {babyList && (
            <div className="card">
              <p className="eyebrow">검사할 아이를 선택하세요</p>
              <div style={babyPickerListStyle}>
                {babyList.map((baby) => (
                  <button
                    key={baby.babyNo}
                    type="button"
                    style={babyPickBtnStyle}
                    onClick={() =>
                      baby.babyNo !== undefined && selectBaby(baby.babyNo)
                    }
                  >
                    {baby.babyName}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Outlet />
        </div>
      </div>
    </BasicLayout>
  );
};

export default HealthIndexPage;
