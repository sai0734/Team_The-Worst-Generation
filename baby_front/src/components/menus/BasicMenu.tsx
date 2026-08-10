import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import type { RootState } from "../../store";

const BasicMenu = () => {
  const loginState = useSelector((state: RootState) => state.loginSlice);

  return (
    <header className="top">
      <Link className="logo" to="/">
        <b>아이</b>봄
      </Link>

      <div className="top-right">
        {/* TODO: 챗봇 담당자님이 ChatbotWidget open state랑 연결 예정 */}
        <button type="button" className="tool">
          <i>💬</i>
          <span>AI 챗봇</span>
        </button>
        <button type="button" className="tool">
          <i>📹</i>
          <span>홈캠</span>
          <b className="live"></b>
        </button>

        <div className="account">
          <Link to="/mypage">마이페이지</Link>
          {loginState.email ? (
            <Link to="/member/logout">로그아웃</Link>
          ) : (
            <Link to="/member/login">로그인</Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default BasicMenu;
