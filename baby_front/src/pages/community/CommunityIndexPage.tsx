import { NavLink, Outlet } from "react-router-dom";
import BasicLayout from "../../layouts/BasicLayout";

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `pr-6 text-lg font-bold ${isActive ? "text-blue-600 underline" : "text-gray-600"}`;

const CommunityIndexPage = () => {
  return (
    <BasicLayout>
      <nav className="flex mb-4 border-b pb-2">
        <NavLink to="/community" end className={tabClass}>
          자유게시판
        </NavLink>
        <NavLink to="/community/babysitter" className={tabClass}>
          베이비시터
        </NavLink>
      </nav>

      <Outlet />
    </BasicLayout>
  );
};

export default CommunityIndexPage;
