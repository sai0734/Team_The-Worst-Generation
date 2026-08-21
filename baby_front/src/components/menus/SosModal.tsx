import axios from "axios";
import { useState, type FormEvent } from "react";
import { requestEmergencySOS } from "../../api/emergencyApi";
import useCustomLogin from "../../hooks/useCustomLogin";
import type { EmergencySosHospital } from "../../types/emergency";

const PHONE_PATTERN = /^01[016789][0-9]{7,8}$/;
const PHONE_STORAGE_KEY = "babycare.sos.notificationPhone";

interface SosModalProps {
  onClose: () => void;
}

const normalizePhone = (value: string) => value.replace(/\D/g, "");

const loadSavedPhone = () => {
  try {
    return localStorage.getItem(PHONE_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
};

const savePhone = (phone: string) => {
  try {
    localStorage.setItem(PHONE_STORAGE_KEY, phone);
  } catch {
    // ignore
  }
};

const getCurrentPosition = () =>
  new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("LOCATION_UNSUPPORTED"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 30_000,
    });
  });

const isGeolocationError = (
  error: unknown,
): error is { code: number; PERMISSION_DENIED: number } =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  "PERMISSION_DENIED" in error;

const describeError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return "로그인 정보가 만료되었어요. 다시 로그인해주세요.";
    }
    const message = error.response?.data?.message ?? error.response?.data?.msg;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (isGeolocationError(error)) {
    if (error.code === error.PERMISSION_DENIED) {
      return "위치 권한이 필요해요. 브라우저에서 위치 허용 후 다시 요청해주세요.";
    }
    return "현재 위치를 확인하지 못했어요. 위치 기능을 켠 뒤 다시 시도해주세요.";
  }

  if (error instanceof Error && error.message === "LOCATION_UNSUPPORTED") {
    return "이 브라우저에서는 현재 위치를 사용할 수 없어요.";
  }

  return "응급 요청을 보내지 못했어요. 잠시 후 다시 시도해주세요.";
};

const SosModal = ({ onClose }: SosModalProps) => {
  const { isLogin, moveToLogin } = useCustomLogin();
  const [notificationPhone, setNotificationPhone] = useState(loadSavedPhone);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedHospital, setSelectedHospital] =
    useState<EmergencySosHospital | null>(null);

  const handleConfirm = async (event: FormEvent) => {
    event.preventDefault();

    if (!isLogin) {
      moveToLogin();
      return;
    }

    const phone = normalizePhone(notificationPhone);
    if (!PHONE_PATTERN.test(phone)) {
      setErrorMessage("올바른 보호자 휴대전화 번호를 입력해주세요.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const position = await getCurrentPosition();
      const result = await requestEmergencySOS({
        longitude: position.coords.longitude,
        latitude: position.coords.latitude,
        stage1: "",
        stage2: "",
        pageNo: 1,
        numOfRows: 10,
        notificationPhone: phone,
      });

      savePhone(phone);
      setSelectedHospital(result.selectedHospital);
    } catch (error: unknown) {
      setErrorMessage(describeError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="sos-modal-backdrop"
      role="presentation"
      onMouseDown={() => {
        if (!submitting) onClose();
      }}
    >
      <section
        className="sos-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sos-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className="sos-modal__icon" aria-hidden="true">
          !
        </span>

        {selectedHospital ? (
          <>
            <h2 id="sos-modal-title">응급 요청을 보냈어요</h2>
            <p>
              가까운 응급실은 {selectedHospital.hospitalName}입니다.
              입력하신 보호자 번호로 안내 문자를 보냅니다.
            </p>
            <p className="sos-modal__hospital">{selectedHospital.address}</p>
            <div className="sos-modal__actions sos-modal__actions--single">
              <button type="button" className="sos-modal__confirm" onClick={onClose}>
                확인
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleConfirm}>
            <h2 id="sos-modal-title">응급 요청을 하시겠습니까?</h2>
            <p>잘못 누르셨다면 취소를 선택해주세요. 안내 문자를 받을 보호자 번호가 필요합니다.</p>

            <label className="sos-modal__field">
              <span>보호자 번호</span>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={notificationPhone}
                onChange={(event) => setNotificationPhone(event.target.value)}
                placeholder="010-1234-5678"
                disabled={submitting || !isLogin}
              />
            </label>

            {!isLogin && (
              <p className="sos-modal__error">로그인 후 응급 요청을 보낼 수 있어요.</p>
            )}
            {errorMessage && <p className="sos-modal__error">{errorMessage}</p>}

            <div className="sos-modal__actions">
              <button
                type="button"
                className="sos-modal__cancel"
                onClick={onClose}
                disabled={submitting}
              >
                취소
              </button>
              <button
                type="submit"
                className="sos-modal__confirm"
                disabled={submitting}
              >
                {submitting
                  ? "요청 중..."
                  : isLogin
                    ? "응급 요청하기"
                    : "로그인하고 요청"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
};

export default SosModal;
