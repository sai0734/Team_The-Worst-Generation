import { FormEvent, useEffect, useState } from "react";
import * as behaviorApi from "../../api/behaviorApi";
import { BehaviorConsult, BehaviorMessage } from "../../api/behaviorApi";

interface BehaviorAnswerProps {
  consult: BehaviorConsult;
}

const formatPubDate = (pubDate: string) => {
  const date = new Date(pubDate);
  if (isNaN(date.getTime())) return pubDate;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
};

const BehaviorAnswerComponent = ({ consult }: BehaviorAnswerProps) => {
  const [messages, setMessages] = useState<BehaviorMessage[]>(consult.messages);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setMessages(consult.messages);
    setChatInput("");
  }, [consult.consultNo]);

  const handleSend = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!chatInput.trim()) return;

    setSending(true);
    try {
      const updated = await behaviorApi.addMessage(
        consult.consultNo,
        chatInput.trim(),
      );
      setMessages(updated.messages);
      setChatInput("");
    } catch (err) {
      alert("후속질문 전송에 실패했습니다.");
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-[24px] border border-[rgba(42,41,38,0.1)] bg-white p-4 sm:p-6">
      <div>
        <p className="text-[11px] font-extrabold tracking-[2px] text-[#5AB2FF]">
          {consult.category}
        </p>
        <p className="mt-1 text-sm text-[#7A756C]">{consult.situation}</p>
      </div>

      <div className="rounded-[16px] border border-[#CAF4FF] bg-[#F0FAFF] p-4 text-sm leading-relaxed text-[#1E6FCC]">
        {consult.aiSummary}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs text-[#7A756C]">
          번호는 AI가 추천하는 순서예요. 순서대로 다 시도할 필요 없이, 우리 아이 상황에 맞는 방법을 하나 골라보세요.
        </p>
        {consult.steps.map((step) => (
          <div
            key={step.stepOrder}
            className="rounded-[16px] border border-[rgba(42,41,38,0.1)] p-4"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#5AB2FF] text-xs font-bold text-white">
                {step.stepOrder}
              </span>
              <div>
                <p className="text-sm font-bold text-[#2A2926]">{step.title}</p>
                <p className="mt-1 text-xs text-[#7A756C]">
                  {step.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {consult.sources.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold text-[#7A756C]">참고 기사</p>
          {consult.sources.map((source) => (
            <a
              key={source.link}
              href={source.link}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[14px] border border-[rgba(42,41,38,0.1)] p-3 text-sm transition-colors hover:border-[#5AB2FF]"
            >
              <p className="font-bold text-[#2A2926]">{source.title}</p>
              <p className="mt-1 text-xs text-[#7A756C]">
                {source.press ?? "출처 미상"} · {formatPubDate(source.pubDate)}
              </p>
            </a>
          ))}
        </div>
      )}

      {consult.videoId && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold text-[#7A756C]">추천 영상</p>
          <div className="aspect-video w-full overflow-hidden rounded-[16px]">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${consult.videoId}`}
              title={consult.videoTitle ?? "추천 영상"}
              allowFullScreen
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold text-[#7A756C]">추가로 궁금하신가요?</p>
        <div className="flex flex-col gap-2">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[78%] rounded-[14px] px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "rounded-br-[4px] bg-[#2A2926] text-white"
                    : "rounded-bl-[4px] bg-[#EAF6FF] text-[#1E6FCC]"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            className="flex-1 rounded-full border border-[rgba(42,41,38,0.12)] bg-white px-4 py-2.5 text-sm text-[#2A2926] outline-none transition-colors focus:border-[#5AB2FF]"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="이어서 질문해보세요"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#005BB2] text-white transition-colors hover:bg-[#004A99] disabled:cursor-not-allowed disabled:bg-[#CBD5E1]"
          >
            {sending ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              "↑"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BehaviorAnswerComponent;
