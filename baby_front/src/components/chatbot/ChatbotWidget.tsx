import { useState } from "react";
import ChatbotPanel from "./ChatbotPanel";

const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 우하단 플로팅 버튼 */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 rounded-full bg-sky-500 px-4 py-3 font-bold text-white shadow-lg"
      >
        챗봇
      </button>

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
