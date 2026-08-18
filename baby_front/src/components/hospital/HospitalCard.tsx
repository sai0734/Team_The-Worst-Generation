import { Link } from "react-router-dom";
import type { MapCoordinate, PediatricHospital } from "../../types/hospital";

interface HospitalCardProps {
  hospital: PediatricHospital;
  rank: number;
  selected: boolean;
  userLocation: MapCoordinate | null;
  onSelect: (hospital: PediatricHospital) => void;
}

const formatDistance = (distance: number | null): string => {
  if (distance == null) return "거리 정보 없음";
  return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
};

const formatTime = (time: string | null): string => {
  if (!time || time.length !== 4) return "";
  return `${time.slice(0, 2)}:${time.slice(2)}`;
};

const isOpenNow = (startTime: string | null, endTime: string | null): boolean | null => {
  if (!startTime || !endTime || startTime.length !== 4 || endTime.length !== 4) return null;
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const start = Number(startTime.slice(0, 2)) * 60 + Number(startTime.slice(2));
  const end = Number(endTime.slice(0, 2)) * 60 + Number(endTime.slice(2));
  return current >= start && current <= end;
};

const PinIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
);

const ReservationIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18M8 15l2.5 2.5L16 12"/></svg>
);

const RouteIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 3-7.4 18-2.2-8.4L3 10.4 21 3Z"/></svg>
);

const HospitalCard = ({ hospital, rank, selected, userLocation, onSelect }: HospitalCardProps) => {
  const destination = `${encodeURIComponent(hospital.hospitalName)},${hospital.latitude},${hospital.longitude}`;
  const directionsUrl = userLocation
    ? `https://map.kakao.com/link/from/${encodeURIComponent("현재 위치")},${userLocation.lat},${userLocation.lng}/to/${destination}`
    : `https://map.kakao.com/link/to/${destination}`;
  const schedule = [formatTime(hospital.startTime), formatTime(hospital.endTime)].filter(Boolean).join(" - ");
  const open = isOpenNow(hospital.startTime, hospital.endTime);
  const waitingLevel = hospital.waitingPatientCount == null
    ? "unknown"
    : hospital.waitingPatientCount <= 2 ? "calm" : hospital.waitingPatientCount <= 5 ? "normal" : "busy";

  return (
    <article
      className={`hospital-card${selected ? " is-selected" : ""}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(hospital)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(hospital);
        }
      }}
      aria-pressed={selected}
    >
      <div className="hospital-card-main">
        <div className="hospital-card-titleline">
          <span className="hospital-rank" aria-label={`${rank}위`}>{rank}</span>
          <h3>{hospital.hospitalName}</h3>
          <span className="hospital-distance">{formatDistance(hospital.distance)}</span>
        </div>
        <span className="hospital-type">소아청소년과</span>
        <p className="hospital-address"><PinIcon /> <span>{hospital.address}</span></p>
        {schedule && (
          <p className="hospital-hours">
            <ClockIcon />
            <span className={open ? "is-open" : ""}>{open == null ? "진료시간" : open ? "진료 중" : "진료 종료"}</span>
            <span aria-hidden="true">·</span>
            <span>{schedule}</span>
          </p>
        )}
      </div>
      <div className={`hospital-waiting is-${waitingLevel}`}>
        <span className="hospital-waiting-label">현재 대기</span>
        <strong>{hospital.waitingPatientCount == null ? "-" : `${hospital.waitingPatientCount}명`}</strong>
        {hospital.waitingPatientCount != null && hospital.waitingChange != null && (
          <span className={hospital.waitingChange > 0 ? "is-up" : hospital.waitingChange < 0 ? "is-down" : ""}>
            {hospital.waitingChange === 0
              ? "변동 없음"
              : `${hospital.waitingChange > 0 ? "+" : ""}${hospital.waitingChange}명`}
          </span>
        )}
      </div>
      <div className="hospital-card-actions">
        <Link to="/hospital/reservation" className="ghost-btn" onClick={(event) => event.stopPropagation()}>
          <ReservationIcon /> 예약하기
        </Link>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="submit-btn"
          onClick={(event) => event.stopPropagation()}
        >
          <RouteIcon /> 길찾기
        </a>
      </div>
    </article>
  );
};

export default HospitalCard;
