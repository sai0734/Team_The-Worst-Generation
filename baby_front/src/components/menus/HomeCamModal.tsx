import { useEffect, useRef, useState } from "react";

interface HomeCamModalProps {
  onClose: () => void;
}

const HomeCamModal = ({ onClose }: HomeCamModalProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("이 브라우저는 카메라 기능을 지원하지 않습니다.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            aspectRatio: { ideal: 16 / 9 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        if (!cancelled) {
          setError("카메라를 사용할 수 없습니다. 카메라 권한을 허용해주세요.");
        }
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", closeWithEscape);
    return () => window.removeEventListener("keydown", closeWithEscape);
  }, [onClose]);

  return (
    <div
      className="homecam-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="homecam-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="homecam-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="homecam-modal__head">
          <h2 id="homecam-modal-title">홈캠</h2>
          <button
            type="button"
            className="homecam-modal__close"
            onClick={onClose}
            aria-label="홈캠 닫기"
          >
            ×
          </button>
        </div>

        <div className="homecam-modal__body">
          {error ? (
            <p className="homecam-modal__error">{error}</p>
          ) : (
            <video
              ref={videoRef}
              className="homecam-modal__video"
              autoPlay
              playsInline
              muted
            />
          )}
        </div>
      </section>
    </div>
  );
};

export default HomeCamModal;
