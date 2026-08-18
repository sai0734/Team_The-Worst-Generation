import { useState } from "react";
import * as cryCheckApi from "../../api/cryCheckApi";
import { parseAiResult } from "../../api/cryCheckApi";
import type { CryCheck } from "../../api/cryCheckApi";

interface CryCheckResultViewProps {
  item: CryCheck;
  onFeedbackSubmit?: (feedback: string) => void;
}

// 분석 직후 결과 화면 / 히스토리 펼친 화면 공용 (특징 칩 + 다시듣기 + 순위별 확신도 + 경고문구 + 피드백 칩)
const CryCheckResultView = ({ item, onFeedbackSubmit }: CryCheckResultViewProps) => {
  const [feedback, setFeedback] = useState<string | null>(item.userFeedback ?? null);
  const [submitting, setSubmitting] = useState(false);

  const parsed = parseAiResult(item.aiResultJson);

  const handleFeedback = async (value: string) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await cryCheckApi.submitFeedback(item.cryCheckNo, value);
      setFeedback(value);
      onFeedbackSubmit?.(value);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cry-check-result">
      <div className="cry-check-features">
        <span className="chip">피치 {item.avgPitch}Hz</span>
        <span className="chip">크기 {item.avgVolume}</span>
        <span className="chip">길이 {item.durationSeconds}초</span>
        <span className="chip">패턴 {item.pattern}</span>
      </div>

      {item.audioFileName && (
        <audio
          className="cry-check-audio"
          controls
          src={cryCheckApi.getFileUrl(item.audioFileName)}
        />
      )}

      {parsed.candidates.length > 0 ? (
        <div className="cry-check-candidates">
          {parsed.candidates.map((c) => (
            <div
              className={`cry-check-candidate${c.rank === 1 ? " primary" : ""}`}
              key={c.rank}
            >
              <div className="cry-check-candidate-head">
                <span className="cause">
                  {c.rank}. {c.cause}
                </span>
                {c.confidence != null && <span className="pct">{c.confidence}%</span>}
              </div>
              {c.confidence != null && (
                <div className="prob-track">
                  <div className="prob-fill" style={{ width: `${c.confidence}%` }} />
                </div>
              )}
              <div className="reason">{c.reason}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="cry-check-notice">
          {parsed.notice ?? "분석 결과가 없습니다."}
        </div>
      )}

      <div className="cry-check-disclaimer">
        AI 추정 결과로 100% 정확하지 않을 수 있어요. 실제 원인을 알려주시면 다음 분석이 더 정확해져요.
      </div>

      {parsed.candidates.length > 0 && (
        <div className="cry-check-feedback">
          {feedback ? (
            <span className="cry-check-feedback-done">
              "{feedback}" 피드백이 반영됐어요. 감사합니다!
            </span>
          ) : (
            <div className="feedback-chips">
              {parsed.candidates.map((c) => (
                <button
                  key={c.cause}
                  type="button"
                  className="chip"
                  disabled={submitting}
                  onClick={() => handleFeedback(c.cause)}
                >
                  {c.cause} 맞음
                </button>
              ))}
              <button
                type="button"
                className="chip"
                disabled={submitting}
                onClick={() => handleFeedback("기타")}
              >
                전부 아니었어요
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CryCheckResultView;
