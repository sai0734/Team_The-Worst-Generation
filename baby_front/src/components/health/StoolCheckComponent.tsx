import { useCallback, useEffect, useState, type CSSProperties } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
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
  const [isDragging, setIsDragging] = useState(false);

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

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setImage(file);
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
    <div className="health-check-layout">
      <div className="card">
        <div className="head">
          <h2>아기 대변 사진 등록</h2>
        </div>

        <div className="health-check-columns">
          <div className="health-check-input-col">
            <form onSubmit={handleSubmit}>
              <label
                className={`health-dropzone${isDragging ? " is-dragging" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <span className="health-dropzone-icon">📷</span>
                <span className="health-dropzone-label">
                  {image ? image.name : "사진을 선택하거나 이 영역에 끌어다 놓으세요"}
                </span>
                <span className="health-dropzone-hint">
                  기저귀 사진을 밝은 곳에서 찍어서 올려주세요
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="health-dropzone-input"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className={`submit-btn${loading ? " is-loading" : ""}`}
                style={{ marginTop: 14, width: "100%" }}
              >
                {loading && <span className="btn-spinner" />}
                {loading ? "분석 중..." : "대변 상태 분석"}
              </button>
            </form>
          </div>

          <div className="health-check-result-col">
            {result ? (
              <div>
                <p className="eyebrow">분석 결과</p>
                <div style={{ marginTop: 8 }}>
                  <ResultBlock aiResult={result.aiResult} />
                </div>
              </div>
            ) : (
              <div className="health-check-result-empty">
                <span className="health-check-result-empty-icon">🧷</span>
                <p className="health-check-result-empty-title">
                  아직 분석 결과가 없어요
                </p>
                <p className="health-check-result-empty-desc">
                  왼쪽에서 사진을 올리고 "대변 상태 분석"을 누르면
                  <br />
                  여기에 결과가 표시돼요
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <p className="eyebrow" style={{ marginBottom: 12 }}>
          검사 이력
        </p>
        {history.length === 0 ? (
          <p className="empty-hint">검사 이력이 없습니다.</p>
        ) : (
          <div className="health-check-history-list">
            {history.map((item) => (
              <div key={item.checkNo} className="health-check-history-item">
                <p className="date">{item.regTime}</p>
                <ResultBlock aiResult={item.aiResult} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoolCheckComponent;
