import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import * as healthApi from "../../api/healthApi";
import type { BabySkinCheck } from "../../types/health";

interface SkinCheckComponentProps {
  babyNo: number;
}

const SkinCheckComponent = ({ babyNo }: SkinCheckComponentProps) => {
  const [image, setImage] = useState<File | null>(null);
  const [result, setResult] = useState<BabySkinCheck | null>(null);
  const [history, setHistory] = useState<BabySkinCheck[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    const data = await healthApi.getSkinHistory(babyNo);
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
      alert("피부 사진을 선택해주세요.");
      return;
    }

    setLoading(true);
    try {
      const checked = await healthApi.checkSkin(babyNo, image);
      setResult(checked);
      await loadHistory();
    } catch (err) {
      alert("피부 상태 분석에 실패했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="head">
        <h2>아기 피부 사진 등록</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="photo-upload">
          <p>피부 사진 등록</p>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <p className="photo-hint">
            증상이 잘 보이는 부위를 촬영해서 올려주세요.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="submit-btn"
          style={{ marginTop: 14, width: "100%" }}
        >
          {loading ? "분석 중..." : "피부 상태 분석"}
        </button>
      </form>

      {result && (
        <div className="card" style={{ marginTop: 16 }}>
          <p className="eyebrow">분석 결과</p>
          <p style={{ marginTop: 8, whiteSpace: "pre-line" }}>
            {result.aiResult}
          </p>
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
                <p style={{ marginTop: 4, whiteSpace: "pre-line" }}>
                  {item.aiResult}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SkinCheckComponent;
