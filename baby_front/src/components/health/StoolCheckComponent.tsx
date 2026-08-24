import { useCallback, useEffect, useState, type CSSProperties } from "react";
import type { ChangeEvent, FormEvent } from "react";
import * as healthApi from "../../api/healthApi";
import type { BabyStoolCheck } from "../../types/health";
import { parseHealthCheckResult } from "../../util/healthResultParser";

interface StoolCheckComponentProps {
  babyNo: number;
}

const resultRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "64px 1fr",
  gap: 8,
  alignItems: "start",
};

const resultLabelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "var(--muted)",
};

const ResultBlock = ({ aiResult }: { aiResult?: string }) => {
  const parsed = parseHealthCheckResult(aiResult ?? "");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={resultRowStyle}>
        <span style={resultLabelStyle}>상태</span>
        <span>{parsed.status}</span>
      </div>
      <div style={resultRowStyle}>
        <span style={resultLabelStyle}>판정</span>
        <span>{parsed.verdict}</span>
      </div>
      <div style={resultRowStyle}>
        <span style={resultLabelStyle}>대처법</span>
        <span>{parsed.action}</span>
      </div>
    </div>
  );
};

const StoolCheckComponent = ({ babyNo }: StoolCheckComponentProps) => {
  const [image, setImage] = useState<File | null>(null);
  const [result, setResult] = useState<BabyStoolCheck | null>(null);
  const [history, setHistory] = useState<BabyStoolCheck[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    const data = await healthApi.getStoolHistory(babyNo);
    setHistory(data);
  }, [babyNo]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setImage(e.target.files?.[0] ?? null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!image) {
      alert("대변 사진을 선택해주세요.");
      return;
    }

    setLoading(true);
    try {
      const checked = await healthApi.checkStool(babyNo, image);
      setResult(checked);
      await loadHistory();
    } catch (err) {
      alert("대변 상태 분석에 실패했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="head">
        <h2>아기 대변 사진 등록</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="photo-upload">
          <p>대변 사진 등록</p>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <p className="photo-hint">
            기저귀 사진을 밝은 곳에서 찍어서 올려주세요.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="submit-btn"
          style={{ marginTop: 14, width: "100%" }}
        >
          {loading ? "분석 중..." : "대변 상태 분석"}
        </button>
      </form>

      {result && (
        <div className="card" style={{ marginTop: 16 }}>
          <p className="eyebrow">분석 결과</p>
          <div style={{ marginTop: 8 }}>
            <ResultBlock aiResult={result.aiResult} />
          </div>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <p className="eyebrow" style={{ marginBottom: 10 }}>
          검사 이력
        </p>
        {history.length === 0 ? (
          <p className="empty-hint">검사 이력이 없습니다.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {history.map((item) => (
              <div
                key={item.checkNo}
                className="card"
                style={{ padding: "10px 14px" }}
              >
                <p style={{ fontSize: 11, color: "var(--muted)" }}>
                  {item.regTime}
                </p>
                <div style={{ marginTop: 4 }}>
                  <ResultBlock aiResult={item.aiResult} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoolCheckComponent;
