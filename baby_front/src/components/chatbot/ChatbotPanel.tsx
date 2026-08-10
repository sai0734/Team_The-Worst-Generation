import { useState } from "react";
import { chatbotApi } from "../../api/chatbotApi";

const ChatbotPanel = () => {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [reply, setReply] = useState("아이의 나이(개월)부터 알려주세요.");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    try {
      const res = await chatbotApi.chat({
        message: input.trim(),
        history,
      });
      setHistory((h) => [
        ...h,
        `보호자: ${input.trim()}`,
        `봇: ${res.reply}`,
      ]);
      setReply(res.reply);
      if (res.ready) setSummary(res.summary);
      setInput("");
    } catch (e) {
      console.error(e);
      alert("챗봇 요청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col space-y-4">
      <h2 className="text-xl font-bold text-gray-900">
        소아과 방문 전 증상 요약
      </h2>

      <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border bg-gray-50 p-3 text-sm">
        {history.length === 0 ? (
          <p className="text-gray-500">{reply}</p>
        ) : (
          history.map((line, i) => (
            <p key={i} className="whitespace-pre-wrap text-gray-800">
              {line}
            </p>
          ))
        )}
        {loading && <p className="text-gray-400">...</p>}
      </div>

      {summary && (
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
          <p className="mb-1 text-sm font-bold text-sky-800">
            의사에게 보여줄 요약
          </p>
          <pre className="whitespace-pre-wrap text-sm text-gray-800">
            {summary}
          </pre>
        </div>
      )}

      <div className="flex gap-2">
        <input
          className="min-w-0 flex-1 rounded border px-3 py-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="증상을 입력하세요"
        />
        <button
          type="button"
          onClick={send}
          disabled={loading}
          className="shrink-0 rounded bg-sky-500 px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "..." : "전송"}
        </button>
      </div>
    </div>
  );
};

export default ChatbotPanel;
