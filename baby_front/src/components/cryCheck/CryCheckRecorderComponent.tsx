import { ChangeEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import useCustomLogin from "../../hooks/useCustomLogin";
import * as cryCheckApi from "../../api/cryCheckApi";
import { parseAiResult } from "../../api/cryCheckApi";
import type { CryCheck } from "../../api/cryCheckApi";
import { extractCryFeatures } from "../../util/audioFeatureExtractor";

interface CryCheckRecorderProps {
  onAnalyzed?: () => void;
}

const CryCheckRecorderComponent = ({ onAnalyzed }: CryCheckRecorderProps) => {
  const navigate = useNavigate();
  const { isLogin } = useCustomLogin();
  const currentBaby = useSelector(
    (state: RootState) => state.babySlice.currentBaby,
  );

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CryCheck | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setUploadedFile(file);
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    const source = uploadedFile;

    if (!source) {
      setError("먼저 파일을 선택해주세요.");
      return;
    }

    if (!currentBaby?.babyNo) {
      setError("아이 정보를 먼저 선택해주세요.");
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const features = await extractCryFeatures(source);
      const analyzed = await cryCheckApi.analyze({
        babyNo: currentBaby.babyNo,
        ...features,
      });
      setResult(analyzed);
      onAnalyzed?.();
    } catch {
      setError(
        "분석 중 오류가 발생했습니다. 소리가 담긴 파일인지 확인해주세요.",
      );
    } finally {
      setAnalyzing(false);
    }
  };

  if (!isLogin) {
    return (
      <div className="card">
        <p>로그인이 필요한 페이지입니다.</p>
        <button className="btn" onClick={() => navigate("/member/login")}>
          로그인하러 가기
        </button>
      </div>
    );
  }

  const parsedResult = result ? parseAiResult(result.aiResultJson) : null;

  return (
    <div className="card cry-check-recorder">
      <div className="head">
        <h2>울음소리 분석</h2>
      </div>

      <div className="cry-check-upload">
        <p className="cry-check-hint">
          아기 울음이 담긴 음성/영상 파일을 올려주세요.
        </p>
        <input
          type="file"
          accept="audio/*,video/*"
          onChange={handleFileChange}
        />
        {uploadedFile && (
          <span className="cry-check-filename">{uploadedFile.name}</span>
        )}
      </div>

      {error && (
        <p className="alert" style={{ marginTop: 10 }}>
          {error}
        </p>
      )}

      <button
        type="button"
        className="btn cry-check-analyze-btn"
        onClick={handleAnalyze}
        disabled={analyzing}
      >
        {analyzing ? "분석 중..." : "분석하기"}
      </button>

      {parsedResult && result && (
        <div className="cry-check-result">
          <div className="cry-check-features">
            <span className="chip">피치 {result.avgPitch}Hz</span>
            <span className="chip">크기 {result.avgVolume}</span>
            <span className="chip">길이 {result.durationSeconds}초</span>
            <span className="chip">패턴 {result.pattern}</span>
          </div>

          {parsedResult.candidates.length > 0 ? (
            parsedResult.candidates.map((c) => (
              <div className="cry-check-candidate" key={c.rank}>
                <span className="rank">{c.rank}</span>
                <div>
                  <div className="cause">{c.cause}</div>
                  <div className="reason">{c.reason}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="cry-check-notice">
              {parsedResult.notice ?? "분석 결과가 없습니다."}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CryCheckRecorderComponent;
