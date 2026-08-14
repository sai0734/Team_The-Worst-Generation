import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ChatbotPanel from "./ChatbotPanel";
import "../../styles/chatbot-modal.css";

const OPEN_CHATBOT_EVENT = "open-chatbot";

const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openHandler = () => setOpen(true);
    window.addEventListener(OPEN_CHATBOT_EVENT, openHandler);
    return () => window.removeEventListener(OPEN_CHATBOT_EVENT, openHandler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="chatbot-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="AI 상담"
      onClick={() => setOpen(false)}
    >
      <div className="chatbot-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chatbot-modal-bar">
          <span />
          <span />
          <span />
          <p>아이봄 AI 상담</p>
          <button
            type="button"
            className="chatbot-close"
            aria-label="닫기"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </div>
        <div className="chatbot-modal-body">
          <ChatbotPanel />
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ChatbotWidget;
