import { useEffect, useState } from "react";
import ChatbotPanel from "./ChatbotPanel";

const OPEN_CHATBOT_EVENT = "open-chatbot";

const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openHandler = () => setOpen(true);
    window.addEventListener(OPEN_CHATBOT_EVENT, openHandler);
    return () => window.removeEventListener(OPEN_CHATBOT_EVENT, openHandler);
  }, []);

  return (
    <>
      {/* 가운데 모달 */}
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <ChatbotPanel />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 w-full rounded bg-gray-200 py-2 text-sm font-semibold text-gray-800"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
