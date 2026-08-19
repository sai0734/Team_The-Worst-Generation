import {
  FilesetResolver,
  ObjectDetector,
  type ObjectDetectorResult,
} from "@mediapipe/tasks-vision";
import * as homeCamApi from "../api/homeCamApi";

// MediaPipe wasm 런타임 + 모델 파일은 최초 1회만 CDN에서 받아오고(브라우저 캐시됨),
// 그 이후 실제 프레임 인식은 전부 로컬(WASM)에서 돌아감 - 프레임마다 네트워크/과금 없음.
const WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite";

const DETECTION_SCORE_THRESHOLD = 0.5;
// 사람이 안전영역 밖(또는 아예 인식 안 됨) 상태로 이만큼 연속 프레임 유지되면 알림
// (대략 초당 20~30프레임 기준 0.3~0.5초 정도 - 순간적인 오탐/미인식은 무시)
const OUT_OF_ZONE_FRAME_THRESHOLD = 15;

export interface HomeCamDetection {
  categoryName: string;
  score: number;
  originX: number;
  originY: number;
  width: number;
  height: number;
}

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
  detections: HomeCamDetection[];
  safeZone: SafeZoneRatio | null;
  isAlertActive: boolean;
  error: string | null;
}

type Listener = () => void;

let snapshot: HomeCamSnapshot = {
  isMonitoring: false,
  isViewing: false,
  stream: null,
  detections: [],
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

let objectDetector: ObjectDetector | null = null;
let rafId: number | null = null;

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
// 만들거나 resume 해둬야 함 - 알림이 실제로 뜨는 시점(rAF 루프 안)에서 처음 만들면
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

const ensureDetector = async (): Promise<ObjectDetector> => {
  if (objectDetector) return objectDetector;

  const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
  objectDetector = await ObjectDetector.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL_URL },
    scoreThreshold: DETECTION_SCORE_THRESHOLD,
    // 아기(사람) 감지만 필요하니 TV/의자 등 나머지 COCO 클래스는 결과에서 아예 제외
    categoryAllowlist: ["person"],
    runningMode: "VIDEO",
  });

  return objectDetector;
};

const toHomeCamDetections = (
  result: ObjectDetectorResult,
): HomeCamDetection[] =>
  result.detections
    .filter((d) => d.categories[0])
    .map((d) => ({
      categoryName: d.categories[0].categoryName ?? "object",
      score: d.categories[0].score,
      originX: d.boundingBox?.originX ?? 0,
      originY: d.boundingBox?.originY ?? 0,
      width: d.boundingBox?.width ?? 0,
      height: d.boundingBox?.height ?? 0,
    }));

// 사람 박스 중심점이 안전영역 안에 있는지 판정 (박스 전체가 아니라 중심점 기준 - 살짝 걸치는 건 안전으로 봄)
const isPersonInSafeZone = (
  person: HomeCamDetection,
  zone: SafeZoneRatio,
  videoWidth: number,
  videoHeight: number,
): boolean => {
  const centerXRatio = (person.originX + person.width / 2) / videoWidth;
  const centerYRatio = (person.originY + person.height / 2) / videoHeight;

  return (
    centerXRatio >= zone.xRatio &&
    centerXRatio <= zone.xRatio + zone.wRatio &&
    centerYRatio >= zone.yRatio &&
    centerYRatio <= zone.yRatio + zone.hRatio
  );
};

const evaluateSafeZone = (detections: HomeCamDetection[]) => {
  if (!snapshot.safeZone) return;

  const best = [...detections].sort((a, b) => b.score - a.score)[0];
  const inZone =
    best !== undefined &&
    isPersonInSafeZone(
      best,
      snapshot.safeZone,
      detectionVideo.videoWidth,
      detectionVideo.videoHeight,
    );

  if (inZone) {
    outOfZoneStreak = 0;
    if (snapshot.isAlertActive) {
      setSnapshot({ isAlertActive: false });
      stopAlarmSound();
    }
    return;
  }

  // 사람이 안전영역 밖에 있거나, 아예 화면에서 인식이 안 되는 경우(프레임 밖으로 나감)도 위험으로 취급
  outOfZoneStreak += 1;
  if (
    outOfZoneStreak >= OUT_OF_ZONE_FRAME_THRESHOLD &&
    !snapshot.isAlertActive
  ) {
    setSnapshot({ isAlertActive: true });
    startAlarmSound();
  }
};

const detectLoop = () => {
  if (!snapshot.isMonitoring) {
    rafId = null;
    return;
  }

  if (!objectDetector || detectionVideo.readyState < 2) {
    rafId = requestAnimationFrame(detectLoop);
    return;
  }

  const result = objectDetector.detectForVideo(
    detectionVideo,
    performance.now(),
  );
  const detections = toHomeCamDetections(result);
  setSnapshot({ detections });
  evaluateSafeZone(detections);

  rafId = requestAnimationFrame(detectLoop);
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
      await ensureDetector();

      setSnapshot({ isMonitoring: true, error: null });

      if (rafId === null) {
        rafId = requestAnimationFrame(detectLoop);
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
    setSnapshot({ isMonitoring: false, detections: [], isAlertActive: false });
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
  // 로그인해도 같은 범위가 그대로 불러와짐.
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
