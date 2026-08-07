import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import QuestPanel from "../components/quest/QuestPanel";
import type { RootState } from "../store";

const MainPage = () => {
  const loginState = useSelector((state: RootState) => state.loginSlice);
  const email = loginState.email ?? "";

  return (
    <div className="min-h-screen bg-nx-canvas font-malgun text-nx-ink">
      <header className="sticky top-0 z-20 border-b border-[#e8e8e8] bg-nx-canvas">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4">
          <div className="flex items-center">
            <Link
              to="/"
              className="mr-6 font-nx text-[16px] font-bold tracking-tight text-nx-ink"
            >
              BABY QUEST
            </Link>
            <nav className="hidden items-center md:flex">
              <Link to="/" className="nx-nav-link is-active">
                Home
              </Link>
              {email ? (
                <>
                  <Link to="/todo/" className="nx-nav-link">
                    Todo
                  </Link>
                  <Link to="/products/" className="nx-nav-link">
                    Products
                  </Link>
                  <Link to="/babyInfo/dashboard/" className="nx-nav-link">
                    응애관리
                  </Link>
                </>
              ) : null}
              <Link to="/about" className="nx-nav-link">
                About
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {email ? (
              <Link to="/member/logout" className="nx-btn-ghost">
                Logout
              </Link>
            ) : (
              <Link to="/member/login" className="nx-btn-primary">
                로그인
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1200px] justify-center px-4 py-10">
        <QuestPanel />
      </main>
    </div>
  );
};

export default MainPage;
