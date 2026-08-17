import { useEffect, useState } from "react";
import BasicLayout from "../../layouts/BasicLayout";
import LandingPage from "./LandingPage";

const MainOnlyPage = () => {
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);

  useEffect(() => {
    if (!isSosModalOpen) return;

    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsSosModalOpen(false);
    };

    window.addEventListener("keydown", closeWithEscape);
    return () => window.removeEventListener("keydown", closeWithEscape);
  }, [isSosModalOpen]);

  return (
    <BasicLayout fullBleed>
      <LandingPage />
      <button
        type="button"
        className="main-sos-button"
        aria-label="긴급 도움 요청"
        aria-haspopup="dialog"
        aria-expanded={isSosModalOpen}
        onClick={() => setIsSosModalOpen(true)}
      >
        <span className="main-sos-button__icon" aria-hidden="true">!</span>
        <span>SOS</span>
      </button>

      {isSosModalOpen && (
        <div className="sos-modal-backdrop" role="presentation" onMouseDown={() => setIsSosModalOpen(false)}>
          <section
            className="sos-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sos-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <span className="sos-modal__icon" aria-hidden="true">!</span>
            <h2 id="sos-modal-title">응급 요청을 하시겠습니까?</h2>
            <p>잘못 누르셨다면 취소를 선택해주세요.</p>
            <div className="sos-modal__actions">
              <button type="button" className="sos-modal__cancel" onClick={() => setIsSosModalOpen(false)}>
                취소
              </button>
              <button type="button" className="sos-modal__confirm" onClick={() => setIsSosModalOpen(false)}>
                응급 요청하기
              </button>
            </div>
          </section>
        </div>
      )}
    </BasicLayout>
  );
};

export default MainOnlyPage;
