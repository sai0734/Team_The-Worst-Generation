import { ChangeEvent, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import useCustomLogin from "../../hooks/useCustomLogin";
import * as cryCheckApi from "../../api/cryCheckApi";
import type { CryCheck } from "../../api/cryCheckApi";
import { extractCryFeatures } from "../../util/audioFeatureExtractor";
import CryCheckResultView from "./CryCheckResultView";

interface CryCheckRecorderProps {
  onAnalyzed?: () => void;
}

type InputMode = "upload" | "record";

const CryCheckRecorderComponent = ({ onAnalyzed }: CryCheckRecorderProps) => {
  const navigate = useNavigate();
  const { isLogin } = useCustomLogin();
  const currentBaby = useSelector(
    (state: RootState) => state.babySlice.currentBaby,
  );

  const [mode, setMode] = useState<InputMode>("record");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CryCheck | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setUploadedFile(file);
    setRecordedBlob(null);
    setResult(null);
    setError(null);
  };

  const startRecording = async () => {
    setError(null);
    setResult(null);
    setUploadedFile(null);
    setRecordedBlob(null);

    try {
      // 에코 제거만 끔 - 켜져있으면 스피커로 재생한 소리를 마이크로 다시 녹음할 때 "에코"로
      // 판단해서 지워버림. 노이즈 억제/자동 게인은 그대로 둬야 마이크 원음이 너무 작게 잡혀서
      // 잡음만 도드라지는 문제(치지직거림)가 없음
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      chunksRef.current = [];

      // 브라우저가 실제로 지원하는 포맷을 명시적으로 골라서 씀 (기본값 맡기면 가끔
      // 무음/깨진 인코딩이 나오는 경우가 있어서 후보 중 지원되는 걸 명시적으로 지정)
      const mimeCandidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ];
      const supportedMime = mimeCandidates.find(
        (type) => window.MediaRecorder?.isTypeSupported?.(type),
      );

      const recorder = supportedMime
        ? new MediaRecorder(stream, { mimeType: supportedMime, audioBitsPerSecond: 128000 })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        setRecordedBlob(blob);
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      mediaRecorderRef.current = recorder;
      // 타임슬라이스를 줘서 여러 조각으로 나눠 받음 (끝에 한 번에 몰아 받으면
      // 짧은 녹음에서 인코딩이 깨지는 경우가 있어서 이렇게 하는 게 더 안정적)
      recorder.start(250);
      setRecording(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      setError("마이크 권한을 허용해주세요.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleAnalyze = async () => {
    const source = uploadedFile ?? recordedBlob;

    if (!source) {
      setError("먼저 녹음하거나 파일을 선택해주세요.");
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
      const analyzed = await cryCheckApi.analyze(
        { babyNo: currentBaby.babyNo, ...features },
        source,
      );
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

  const hasSource = !!(uploadedFile ?? recordedBlob);
  const timerLabel = `${String(Math.floor(recordSeconds / 60)).padStart(2, "0")}:${String(recordSeconds % 60).padStart(2, "0")}`;

  return (
    <div className="card cry-check-recorder">
      <div className="cry-check-layout">
        <div className="cry-check-input-col">
          <div className="cry-check-mode-tabs">
            <button
              type="button"
              className={`chip${mode === "record" ? " is-active" : ""}`}
              onClick={() => setMode("record")}
            >
              마이크로 녹음
            </button>
            <button
              type="button"
              className={`chip${mode === "upload" ? " is-active" : ""}`}
              onClick={() => setMode("upload")}
            >
              파일 업로드
            </button>
          </div>

          {mode === "record" ? (
            <div className="cry-check-record-zone">
              <button
                type="button"
                className={`cry-check-mic-btn${recording ? " recording" : ""}`}
                onClick={recording ? stopRecording : startRecording}
              >
                {recording ? "■" : "●"}
              </button>
              <div className="cry-check-rec-state">
                {recording
                  ? "녹음 중... (다시 누르면 종료)"
                  : recordedBlob
                    ? `녹음 완료 (${(recordedBlob.size / 1024).toFixed(1)}KB)`
                    : "탭하여 녹음 시작"}
              </div>
              <div className="cry-check-rec-timer">{timerLabel}</div>
            </div>
          ) : (
            <div className="cry-check-upload">
              <p className="cry-check-hint">
                아기 울음이 담긴 음성/영상 파일을 올려주세요. (영상이어도 소리만 분석·재생됩니다)
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
          )}

          {error && (
            <p className="alert" style={{ marginTop: 10 }}>
              {error}
            </p>
          )}

          <button
            type="button"
            className="btn cry-check-analyze-btn"
            onClick={handleAnalyze}
            disabled={analyzing || !hasSource || recording}
          >
            {analyzing && <span className="cry-check-spinner" aria-hidden="true" />}
            {analyzing ? "분석 중..." : "분석하기"}
          </button>

          {analyzing && (
            <p className="cry-check-analyzing-hint">
              AI가 울음소리를 분석하고 있어요. 몇 초 정도 걸릴 수 있어요.
            </p>
          )}
        </div>

        <div className="cry-check-result-col">
          {result ? (
            <CryCheckResultView item={result} />
          ) : (
            <div className="cry-check-result-empty">
              <span className="cry-check-result-empty-icon">🍼</span>
              <p className="cry-check-result-empty-title">
                아직 분석 결과가 없어요
              </p>
              <p className="cry-check-result-empty-desc">
                왼쪽에서 녹음하거나 파일을 올리고 "분석하기"를 누르면
                <br />
                여기에 결과가 표시돼요
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CryCheckRecorderComponent;
