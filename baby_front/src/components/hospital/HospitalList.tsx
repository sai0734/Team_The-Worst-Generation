import type { MapCoordinate, PediatricHospital } from "../../types/hospital";
import HospitalCard from "./HospitalCard";

interface HospitalListProps {
  hospitals: PediatricHospital[];
  selectedId: string | null;
  loading: boolean;
  errorMessage: string;
  userLocation: MapCoordinate | null;
  onSelect: (hospital: PediatricHospital) => void;
  onRetry: () => void;
}

const HospitalList = ({ hospitals, selectedId, loading, errorMessage, userLocation, onSelect, onRetry }: HospitalListProps) => {
  if (loading) return <div className="hospital-list-state">가까운 소아과를 찾고 있어요...</div>;

  if (errorMessage) {
    return (
      <div className="hospital-list-state">
        <p>{errorMessage}</p>
        <button type="button" className="ghost-btn" onClick={onRetry}>다시 시도</button>
      </div>
    );
  }

  if (hospitals.length === 0) {
    return <div className="hospital-list-state"><p>이 주변에서 소아과를 찾지 못했어요.</p><span>지도를 옮긴 뒤 이 지역에서 다시 찾아보세요.</span></div>;
  }

  return (
    <div className="hospital-list">
      {hospitals.map((hospital, index) => (
        <HospitalCard
          key={hospital.hospitalId}
          hospital={hospital}
          rank={index + 1}
          selected={selectedId === hospital.hospitalId}
          userLocation={userLocation}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};

export default HospitalList;
