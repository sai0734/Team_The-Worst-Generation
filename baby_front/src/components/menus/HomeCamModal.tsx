import { useEffect, useRef, useState, type MouseEventHandler } from "react";
import useHomeCamMonitor from "../../hooks/useHomeCamMonitor";
import { homeCamMonitor } from "../../util/homeCamMonitor";
import type { SafeZoneRatio } from "../../util/homeCamMonitor";

interface HomeCamModalProps {
  onClose: () => void;
}

interface PixelRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// <video>가 object-fit:contain이라 실제 영상이 박스 전체를 안 채우고 레터박스(여백)가
// 생길 수 있음 - 드래그 좌표/박스 오버레이 둘 다 이 "실제 영상이 렌더링된 영역" 기준으로 맞춰야 함
const getVideoContentRect = (video: HTMLVideoElement): PixelRect => {
  const boxW = video.clientWidth;
  const boxH = video.clientHeight;
  const videoW = video.videoWidth;
  const videoH = video.videoHeight;

  if (!videoW || !videoH || !boxW || !boxH) {
    return { x: 0, y: 0, w: boxW, h: boxH };
  }

  const videoAspect = videoW / videoH;
  const boxAspect = boxW / boxH;

  if (videoAspect > boxAspect) {
    const w = boxW;
    const h = boxW / videoAspect;
    return { x: 0, y: (boxH - h) / 2, w, h };
  }

  const h = boxH;
  const w = boxH * videoAspect;
  return { x: (boxW - w) / 2, y: 0, w, h };
};

const HomeCamModal = ({ onClose }: HomeCamModalProps) => {
  const {
    isMonitoring,
    isViewing,
    stream,
    detections,
    safeZone,
    isAlertActive,
    error,
  } = useHomeCamMonitor();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  // 이 모달이 직접 "그냥 보기"를 시작한 경우에만, 닫힐 때 그 보기 상태를 정리함
  const startedViewingRef = useRef(false);

  const [isDrawingZone, setIsDrawingZone] = useState(false);
  const [dragRect, setDragRect] = useState<PixelRect | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    return () => {
      if (startedViewingRef.current) {
        homeCamMonitor.stopViewing();
      }
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // 사람 인식 박스 + 안전영역 오버레이
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !video.videoWidth) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const content = getVideoContentRect(video);

    if (safeZone) {
      ctx.strokeStyle = isAlertActive ? "#ff4d4f" : "#ffd23d";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(
        content.x + safeZone.xRatio * content.w,
        content.y + safeZone.yRatio * content.h,
        safeZone.wRatio * content.w,
        safeZone.hRatio * content.h,
      );
      ctx.setLineDash([]);
    }

    if (!isMonitoring) return;

    detections.forEach((d) => {
      const x = content.x + (d.originX / video.videoWidth) * content.w;
      const y = content.y + (d.originY / video.videoHeight) * content.h;
      const w = (d.width / video.videoWidth) * content.w;
      const h = (d.height / video.videoHeight) * content.h;

      ctx.strokeStyle = "#3ddc84";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      const label = `${d.categoryName} ${Math.round(d.score * 100)}%`;
      ctx.font = "12px sans-serif";
      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = "#3ddc84";
      ctx.fillRect(x, Math.max(0, y - 16), textWidth + 8, 16);
      ctx.fillStyle = "#0a1512";
      ctx.fillText(label, x + 4, Math.max(12, y - 4));
    });
  }, [detections, isMonitoring, safeZone, isAlertActive]);

  useEffect(() => {
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isDrawingZone) onClose();
    };

    window.addEventListener("keydown", closeWithEscape);
    return () => window.removeEventListener("keydown", closeWithEscape);
  }, [onClose, isDrawingZone]);

  const handleStartMonitoring = () => {
    homeCamMonitor.startMonitoring();
  };

  const handleJustView = () => {
    startedViewingRef.current = true;
    homeCamMonitor.startViewing();
  };

  const toWrapPoint = (clientX: number, clientY: number) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handleZoneMouseDown: MouseEventHandler<HTMLDivElement> = (e) => {
    if (!isDrawingZone) return;
    const p = toWrapPoint(e.clientX, e.clientY);
    dragStartRef.current = p;
    setDragRect({ x: p.x, y: p.y, w: 0, h: 0 });
  };

  const handleZoneMouseMove: MouseEventHandler<HTMLDivElement> = (e) => {
    if (!isDrawingZone || !dragStartRef.current) return;
    const p = toWrapPoint(e.clientX, e.clientY);
    const start = dragStartRef.current;
    setDragRect({
      x: Math.min(start.x, p.x),
      y: Math.min(start.y, p.y),
      w: Math.abs(p.x - start.x),
      h: Math.abs(p.y - start.y),
    });
  };

  const handleZoneMouseUp: MouseEventHandler<HTMLDivElement> = () => {
    if (!isDrawingZone || !dragStartRef.current) return;
    dragStartRef.current = null;

    const video = videoRef.current;
    if (!video || !dragRect || dragRect.w < 10 || dragRect.h < 10) {
      setDragRect(null);
      return;
    }

    const content = getVideoContentRect(video);
    const zone: SafeZoneRatio = {
      xRatio: Math.min(1, Math.max(0, (dragRect.x - content.x) / content.w)),
      yRatio: Math.min(1, Math.max(0, (dragRect.y - content.y) / content.h)),
      wRatio: Math.min(1, dragRect.w / content.w),
      hRatio: Math.min(1, dragRect.h / content.h),
    };

    homeCamMonitor.setSafeZone(zone);
    setDragRect(null);
    setIsDrawingZone(false);
  };

  return (
    <div
      className={`homecam-modal-backdrop${isAlertActive ? " homecam-modal-backdrop--alert" : ""}`}
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className={`homecam-modal${isAlertActive ? " homecam-modal--alert" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="homecam-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="homecam-modal__head">
          <h2 id="homecam-modal-title">
            홈캠
            {isMonitoring && (
              <span className="homecam-modal__live">감시 중</span>
            )}
            {!isMonitoring && isViewing && (
              <span className="homecam-modal__live homecam-modal__live--view">
                보기 중
              </span>
            )}
            {isAlertActive && (
              <span className="homecam-modal__live homecam-modal__live--alert">
                안전영역 이탈!
              </span>
            )}
          </h2>
          <div className="homecam-modal__head-actions">
            {stream && (
              <button
                type="button"
                className="btn ghost homecam-modal__zone-btn"
                onClick={() => setIsDrawingZone((prev) => !prev)}
              >
                {isDrawingZone
                  ? "취소"
                  : safeZone
                    ? "침대 범위 다시 설정"
                    : "침대 범위 설정하기"}
              </button>
            )}
            <button
              type="button"
              className="homecam-modal__close"
              onClick={onClose}
              aria-label="홈캠 닫기"
            >
              ×
            </button>
          </div>
        </div>

        <div className="homecam-modal__body">
          {error ? (
            <p className="homecam-modal__error">{error}</p>
          ) : !stream ? (
            <div className="homecam-modal__start">
              <p>지금은 카메라가 꺼져있어요.</p>
              <div className="homecam-modal__start-actions">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={handleJustView}
                >
                  감시 없이 그냥 보기
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={handleStartMonitoring}
                >
                  감시 시작하기
                </button>
              </div>
              <p className="homecam-modal__hint">
                감시 시작 = AI가 침대 범위를 벗어난 움직임을 감지하면 알림을
                드려요. (이 사이트가 켜져 있는 동안만 동작해요)
              </p>
            </div>
          ) : (
            <div
              ref={wrapRef}
              className={`homecam-modal__video-wrap${isDrawingZone ? " is-drawing" : ""}`}
              onMouseDown={handleZoneMouseDown}
              onMouseMove={handleZoneMouseMove}
              onMouseUp={handleZoneMouseUp}
            >
              <video
                ref={videoRef}
                className="homecam-modal__video"
                autoPlay
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="homecam-modal__overlay" />

              {isDrawingZone && (
                <>
                  <div className="homecam-modal__draw-hint">
                    아기가 눕는 침대(안전영역)를 마우스로 드래그해서 사각형으로
                    그려주세요. 이 안에 있으면 안전, 벗어나면 알림이 울려요.
                  </div>
                  {dragRect && (
                    <div
                      className="homecam-modal__draw-rect"
                      style={{
                        left: dragRect.x,
                        top: dragRect.y,
                        width: dragRect.w,
                        height: dragRect.h,
                      }}
                    />
                  )}
                </>
              )}

              {!isDrawingZone && !safeZone && isMonitoring && (
                <div className="homecam-modal__zone-nudge">
                  아직 침대 범위가 설정되지 않았어요. 위의 "침대 범위
                  설정하기"를 눌러주세요.
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomeCamModal;
