export interface CryFeatures {
  avgPitch: number;
  avgVolume: number;
  durationSeconds: number;
  pattern: string;
}

const FRAME_SIZE = 2048;
const HOP_SIZE = 1024;
const MIN_VALID_PITCH_HZ = 50;
const MAX_VALID_PITCH_HZ = 2000;
const MAX_FRAMES_TO_SAMPLE = 80;

// 자기상관(autocorrelation) 기반 단순 피치 검출.
// 정밀한 음성분석용이 아니라 "대략적인 평균 피치"를 뽑아 백엔드 휴리스틱/AI 프롬프트에 넘기기 위한 근사치.
function detectPitch(frame: Float32Array, sampleRate: number): number | null {
  const size = frame.length;

  let rms = 0;
  for (let i = 0; i < size; i++) rms += frame[i] * frame[i];
  rms = Math.sqrt(rms / size);
  if (rms < 0.01) return null;

  const minLag = Math.max(1, Math.floor(sampleRate / MAX_VALID_PITCH_HZ));
  const maxLag = Math.min(
    size - 1,
    Math.floor(sampleRate / MIN_VALID_PITCH_HZ),
  );

  let bestLag = -1;
  let bestVal = -Infinity;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < size - lag; i++) {
      sum += frame[i] * frame[i + lag];
    }
    if (sum > bestVal) {
      bestVal = sum;
      bestLag = lag;
    }
  }

  if (bestLag <= 0) return null;

  const freq = sampleRate / bestLag;
  if (freq < MIN_VALID_PITCH_HZ || freq > MAX_VALID_PITCH_HZ) return null;

  return freq;
}

function classifyPattern(pitches: number[]): string {
  if (pitches.length < 3) return "불규칙";

  const third = Math.max(1, Math.floor(pitches.length / 3));
  const first = pitches.slice(0, third);
  const last = pitches.slice(-third);
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  const firstAvg = avg(first);
  const lastAvg = avg(last);
  const mean = avg(pitches);
  const variance = avg(pitches.map((p) => (p - mean) ** 2));
  const stdDev = Math.sqrt(variance);

  if (mean === 0) return "불규칙";
  if (stdDev / mean > 0.25) return "불규칙";
  if (lastAvg - firstAvg > mean * 0.12) return "상승형";
  if (firstAvg - lastAvg > mean * 0.12) return "하강형";
  return "일정형";
}

// 마이크 녹음 Blob이든, 업로드한 오디오/영상 파일이든 동일하게 디코딩해서
// 평균 피치/상대적 크기/길이/패턴을 뽑아낸다.
export async function extractCryFeatures(source: Blob): Promise<CryFeatures> {
  const arrayBuffer = await source.arrayBuffer();

  const AudioContextCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const audioCtx = new AudioContextCtor();

  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } finally {
    audioCtx.close();
  }

  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const durationSeconds = audioBuffer.duration;

  const totalFrames = Math.max(
    1,
    Math.floor((channelData.length - FRAME_SIZE) / HOP_SIZE) + 1,
  );
  const stride = Math.max(1, Math.floor(totalFrames / MAX_FRAMES_TO_SAMPLE));

  const pitches: number[] = [];
  let sumSquares = 0;
  let sampleCount = 0;

  for (let f = 0; f < totalFrames; f += stride) {
    const start = f * HOP_SIZE;
    const frame = channelData.subarray(start, start + FRAME_SIZE);
    if (frame.length < FRAME_SIZE) break;

    for (let i = 0; i < frame.length; i++) {
      sumSquares += frame[i] * frame[i];
      sampleCount++;
    }

    const pitch = detectPitch(frame, sampleRate);
    if (pitch !== null) pitches.push(pitch);
  }

  const avgVolume =
    sampleCount > 0
      ? Math.min(100, Math.round(Math.sqrt(sumSquares / sampleCount) * 400))
      : 0;

  const avgPitch =
    pitches.length > 0
      ? Math.round(pitches.reduce((a, b) => a + b, 0) / pitches.length)
      : 0;

  const pattern = classifyPattern(pitches);

  return {
    avgPitch,
    avgVolume,
    durationSeconds: Math.round(durationSeconds * 10) / 10,
    pattern,
  };
}
