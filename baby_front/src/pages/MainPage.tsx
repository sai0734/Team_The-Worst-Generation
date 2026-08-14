import useCustomLogin from "../hooks/useCustomLogin";
import DashboardPage from "./DashboardPage";
import MainOnlyPage from "./landing/MainOnlyPage";

// "/" 루트는 로그인 여부에 따라 대시보드/메인(랜딩) 중 하나로 보여주는 자리 그대로 유지.
// 상단 "홈" 메뉴에서 각각을 "/dashboard", "/main"으로 직접 접근할 수도 있음(router/root.tsx 참고).
const MainPage = () => {
  const { isLogin } = useCustomLogin();
  return isLogin ? <DashboardPage /> : <MainOnlyPage />;
};

export default MainPage;
