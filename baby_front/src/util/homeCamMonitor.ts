import * as homeCamApi from "../api/homeCamApi";

// 사람 인식은 브라우저(MediaPipe)가 아니라 백엔드(→ 파이썬 AI서버, YOLOv8 + OpenCV)에서 함.
// 카메라 전체 프레임을 주기적으로 보내면, 서버가 "사람"을 탐지해서 그 좌표가 저장된
// 안전영역(침대 범위) 사각형 안에 있는지 판정해서 돌려줌.
const ANALYZE_INTERVAL_MS = 1500;
// 네트워크 호출 기반이라 프레임 하나하나가 순간적으로 튈 수 있음 - 이만큼 연속으로
// "이탈"이 나와야 실제 알람을 울림 (대략 4~5초 정도 지속된 변화만 알람으로 취급)
const OUT_OF_ZONE_STREAK_THRESHOLD = 3;
// 서버로 보내는 프레임 최대 가로폭(px) - 매 프레임 전송이라 용량을 작게 유지
const FRAME_MAX_WIDTH = 640;

// 비디오 실제 해상도 대비 0~1 비율로 저장 - 카메라 해상도가 바뀌어도 안전영역이 안 틀어짐
export interface SafeZoneRatio {
  xRatio: number;
  yRatio: number;
  wRatio: number;
  hRatio: number;
}

export interface HomeCamSnapshot {
  // "감시": AI가 백그라운드에서 계속 인식하는 모드. 모달을 닫아도 꺼지지 않고
  // BasicMenu의 감시 토글로만 켜고 끔.
  isMonitoring: boolean;
  // "보기": 감시 없이 그냥 지금 화면만 잠깐 보는 모드. 모달 닫으면 같이 꺼짐.
  isViewing: boolean;
  stream: MediaStream | null;
  safeZone: SafeZoneRatio | null;
  isAlertActive: boolean;
  error: string | null;
}

type Listener = () => void;

let snapshot: HomeCamSnapshot = {
  isMonitoring: false,
  isViewing: false,
  stream: null,
  safeZone: null,
  isAlertActive: false,
  error: null,
};

const listeners = new Set<Listener>();
let viewerCount = 0;
let acquiring: Promise<MediaStream> | null = null;
let outOfZoneStreak = 0;
let safeZoneFetched = false;

// 서버에 저장된 안전영역을 최초 1회만 불러옴 (로그인 안 된 상태로 호출되면 그냥 무시하고
// 다음에 감시/보기를 시작할 때 다시 시도함)
const fetchSafeZoneFromServer = async () => {
  if (safeZoneFetched) return;

  try {
    const zone = await homeCamApi.getSafeZone();
    safeZoneFetched = true;
    if (zone) {
      setSnapshot({ safeZone: zone });
    }
  } catch {
    // 로그인 전이거나 네트워크 오류 - 안전영역 없이 진행, 다음 시작 시 재시도
  }
};

// 감지용 내부 video 엘리먼트 - 화면에 안 보여도 되고, 모달이 닫혀있어도 계속 프레임을 흘려보냄
const detectionVideo = document.createElement("video");
detectionVideo.muted = true;
detectionVideo.playsInline = true;

let analyzeIntervalId: ReturnType<typeof setInterval> | null = null;
let analyzeInFlight = false;

let alarmCtx: AudioContext | null = null;
let alarmIntervalId: ReturnType<typeof setInterval> | null = null;

const emit = () => {
  listeners.forEach((listener) => listener());
};

const setSnapshot = (partial: Partial<HomeCamSnapshot>) => {
  snapshot = { ...snapshot, ...partial };
  emit();
};

// 브라우저 자동재생 정책 때문에 AudioContext는 반드시 사용자 클릭 등 "제스처 안"에서
// 만들거나 resume 해둬야 함 - 알림이 실제로 뜨는 시점(분석 루프 안)에서 처음 만들면
// 소리가 안 나올 수 있어서, 감시/보기 시작 버튼을 누르는 시점에 미리 풀어둠
const unlockAlarmContext = () => {
  if (!alarmCtx) {
    alarmCtx = new AudioContext();
  }
  if (alarmCtx.state === "suspended") {
    alarmCtx.resume();
  }
};

const beep = () => {
  if (!alarmCtx) alarmCtx = new AudioContext();
  const osc = alarmCtx.createOscillator();
  const gain = alarmCtx.createGain();
  osc.frequency.value = 880;
  osc.connect(gain);
  gain.connect(alarmCtx.destination);
  gain.gain.setValueAtTime(0.001, alarmCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.35, alarmCtx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, alarmCtx.currentTime + 0.4);
  osc.start();
  osc.stop(alarmCtx.currentTime + 0.4);
};

const startAlarmSound = () => {
  if (alarmIntervalId !== null) return;
  beep();
  alarmIntervalId = setInterval(beep, 900);
};

const stopAlarmSound = () => {
  if (alarmIntervalId !== null) {
    clearInterval(alarmIntervalId);
    alarmIntervalId = null;
  }
};

// 지금 비디오 프레임 전체를 작은 JPEG(base64, data URL 접두어 제외)로 반환.
// 안전영역으로 미리 자르지 않고 화면 전체를 보냄 - 서버(YOLO)가 화면 어디든 사람을
// 찾아야 하기 때문
const captureFullFrame = (): string | null => {
  const video = detectionVideo;
  if (!video.videoWidth || !video.videoHeight || video.readyState < 2) return null;

  const scale = Math.min(1, FRAME_MAX_WIDTH / video.videoWidth);
  const outW = Math.max(1, Math.round(video.videoWidth * scale));
  const outH = Math.max(1, Math.round(video.videoHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, outW, outH);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
  const commaIndex = dataUrl.indexOf(",");
  return commaIndex === -1 ? null : dataUrl.slice(commaIndex + 1);
};

// 전체 프레임을 백엔드로 보내서 안전영역 이탈 여부를 판정받음
const analyzeCurrentFrame = async () => {
  if (!snapshot.isMonitoring || !snapshot.safeZone || analyzeInFlight) return;

  const frame = captureFullFrame();
  if (!frame) return;

  analyzeInFlight = true;
  try {
    const result = await homeCamApi.analyzeFrame(frame);

    // 안전영역 자체가 아직 저장된 적 없음 - 판정 보류 (임의로 알람 울리지 않음)
    if (!result.ready) return;

    if (!result.outOfZone) {
      outOfZoneStreak = 0;
      if (snapshot.isAlertActive) {
        setSnapshot({ isAlertActive: false });
        stopAlarmSound();
      }
      return;
    }

    outOfZoneStreak += 1;
    if (outOfZoneStreak >= OUT_OF_ZONE_STREAK_THRESHOLD && !snapshot.isAlertActive) {
      setSnapshot({ isAlertActive: true });
      startAlarmSound();
    }
  } catch {
    // 네트워크/AI서버 오류 - 이번 프레임은 건너뛰고 다음 주기에 재시도
  } finally {
    analyzeInFlight = false;
  }
};

// 감시든 보기든, 이미 스트림이 있으면 재사용하고 없으면 한 번만 새로 요청함
const acquireStream = async (): Promise<MediaStream> => {
  if (snapshot.stream) return snapshot.stream;
  if (acquiring) return acquiring;

  acquiring = (async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("이 브라우저는 카메라 기능을 지원하지 않습니다.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        aspectRatio: { ideal: 16 / 9 },
      },
      audio: false,
    });

    detectionVideo.srcObject = stream;
    await detectionVideo.play();

    setSnapshot({ stream, error: null });
    return stream;
  })();

  try {
    return await acquiring;
  } finally {
    acquiring = null;
  }
};

// 감시도 보기도 아무도 안 쓰면 카메라 자체를 완전히 끔
const releaseStreamIfUnused = () => {
  if (snapshot.isMonitoring || viewerCount > 0) return;

  snapshot.stream?.getTracks().forEach((track) => track.stop());
  detectionVideo.srcObject = null;
  setSnapshot({ stream: null });
};

export const homeCamMonitor = {
  getSnapshot: (): HomeCamSnapshot => snapshot,

  subscribe: (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  // AI 감시 시작 - 백그라운드에서 계속 인식, 모달 닫아도 안 꺼짐
  startMonitoring: async (): Promise<void> => {
    if (snapshot.isMonitoring) return;

    unlockAlarmContext();
    fetchSafeZoneFromServer();

    try {
      await acquireStream();

      setSnapshot({ isMonitoring: true, error: null });

      if (analyzeIntervalId === null) {
        analyzeIntervalId = setInterval(analyzeCurrentFrame, ANALYZE_INTERVAL_MS);
      }
    } catch {
      setSnapshot({
        error: "카메라를 사용할 수 없습니다. 카메라 권한을 허용해주세요.",
      });
    }
  },

  stopMonitoring: (): void => {
    outOfZoneStreak = 0;
    stopAlarmSound();
    if (analyzeIntervalId !== null) {
      clearInterval(analyzeIntervalId);
      analyzeIntervalId = null;
    }
    setSnapshot({ isMonitoring: false, isAlertActive: false });
    releaseStreamIfUnused();
  },

  // 감시 없이 그냥 지금만 보기 - 모달 닫히면(stopViewing 호출되면) 같이 꺼짐
  // (단, 감시가 이미 켜져있었다면 모달 닫아도 카메라는 계속 켜져있음)
  startViewing: async (): Promise<void> => {
    viewerCount += 1;
    setSnapshot({ isViewing: true });
    fetchSafeZoneFromServer();

    try {
      await acquireStream();
      setSnapshot({ error: null });
    } catch {
      setSnapshot({
        error: "카메라를 사용할 수 없습니다. 카메라 권한을 허용해주세요.",
      });
    }
  },

  stopViewing: (): void => {
    viewerCount = Math.max(0, viewerCount - 1);
    if (viewerCount === 0) {
      setSnapshot({ isViewing: false });
    }
    releaseStreamIfUnused();
  },

  // 화면 드래그로 그린 안전영역(침대 범위) 저장 - 계정에 묶여서 서버(DB)에 저장되고,
  // 다시 그리면 이전 값을 덮어쓸 뿐 쌓이지 않음(email당 항상 1행). 다른 기기/브라우저에서
  // 로그인해도 같은 범위가 그대로 불러와짐. 좌표만 저장하면 끝 - 사람 탐지는 매 프레임
  // 서버(YOLO)가 하기 때문에 여기서 기준 이미지를 따로 캡처해서 보낼 필요가 없음.
  setSafeZone: (zone: SafeZoneRatio): void => {
    outOfZoneStreak = 0;
    stopAlarmSound();
    safeZoneFetched = true;
    setSnapshot({ safeZone: zone, isAlertActive: false });

    homeCamApi.saveSafeZone(zone).catch(() => {
      setSnapshot({
        error: "침대 범위 저장에 실패했어요. 다시 시도해주세요.",
      });
    });
  },

  // 지금 감지 프레임의 비디오 실제 해상도 (안전영역 그릴 때 화면 좌표 -> 비율 환산용)
  getVideoSize: (): { width: number; height: number } => ({
    width: detectionVideo.videoWidth,
    height: detectionVideo.videoHeight,
  }),
};
