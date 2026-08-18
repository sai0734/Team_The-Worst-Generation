import axios from "axios";
import { useState, type FormEvent } from "react";
import { modifyMember } from "../../api/memberApi";
import useCustomLogin from "../../hooks/useCustomLogin";

const PasswordChangePanel = () => {
  const { loginState } = useCustomLogin();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password.trim()) return setMessage("새 비밀번호를 입력해주세요.");
    if (password !== passwordConfirm) return setMessage("비밀번호 확인이 일치하지 않습니다.");

    setSubmitting(true);
    setMessage("");
    try {
      await modifyMember({
        email: loginState.email,
        pw: password,
        nickname: loginState.nickname ?? "",
      });
      setPassword("");
      setPasswordConfirm("");
      setMessage("비밀번호가 변경되었습니다.");
    } catch (error: unknown) {
      setMessage(
        axios.isAxiosError(error) && error.response?.status === 401
          ? "로그인 정보가 만료되었습니다. 다시 로그인해주세요."
          : "비밀번호를 변경하지 못했습니다. 잠시 후 다시 시도해주세요.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card mypage-panel">
      <div className="mypage-panel-heading">
        <div className="mypage-panel-icon">•••</div>
        <div><h2>비밀번호 변경</h2></div>
      </div>
      <form className="mypage-password-form" onSubmit={handleSubmit}>
        <label><span>새 비밀번호</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <label><span>새 비밀번호 확인</span><input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} /></label>
        {message && <p className="mypage-message">{message}</p>}
        <button type="submit" className="submit-btn" disabled={submitting}>{submitting ? "변경 중..." : "비밀번호 변경"}</button>
      </form>
    </section>
  );
};

export default PasswordChangePanel;
