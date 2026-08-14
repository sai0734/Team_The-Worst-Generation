import { useEffect, useRef, useState } from "react";
import { chatbotApi } from "../../api/chatbotApi";

type Role = "bot" | "user";
type ChatMessage = { role: Role; text: string };

const GREETING =
  "안녕하세요. 아이봄 육아 상담이에요. 수면, 수유, 발달 등 궁금한 점을 편하게 말씀해 주세요.";

const ChatbotPanel = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "bot", text: GREETING },
  ]);
  const [loading, setLoading] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const historyForApi = () =>
    messages
      .slice(1)
      .map((m) => `${m.role === "user" ? "보호자" : "봇"}: ${m.text}`);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);

    try {
      const res = await chatbotApi.chat({
        message: text,
        history: historyForApi(),
      });
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: res.reply || "답변을 가져오지 못했어요." },
      ]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "잠시 연결이 불안정해요. 다시 한번 보내 주세요." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-panel">
      <div className="chatbot-panel-head">
        <p className="eyebrow">AI CONSULT</p>
        <h3>육아 AI 상담</h3>
      </div>

      <div className="chatbot-thread" ref={threadRef}>
        {messages.map((msg, i) => (
          <div key={`${msg.role}-${i}`} className={`chatbot-row ${msg.role}`}>
            {msg.role === "bot" && (
              <span className="chatbot-avatar" aria-hidden>
                봄
              </span>
            )}
            <div className={`chatbot-bubble ${msg.role}`}>{msg.text}</div>
          </div>
        ))}
        {loading && (
          <div className="chatbot-row bot">
            <span className="chatbot-avatar" aria-hidden>
              봄
            </span>
            <div className="chatbot-bubble bot typing" aria-label="작성 중">
              <i />
              <i />
              <i />
            </div>
          </div>
        )}
      </div>

      <div className="chatbot-compose">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="육아 고민을 입력하세요"
          aria-label="메시지 입력"
        />
        <button
          type="button"
          className="primary-button small"
          onClick={send}
          disabled={loading || !input.trim()}
        >
          전송
        </button>
      </div>
    </div>
  );
};

export default ChatbotPanel;
