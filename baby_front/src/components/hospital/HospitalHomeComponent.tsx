import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { getNearbyPediatricHospitals, refreshHospitalWaitingCounts } from "../../api/hospitalApi";
import type { MapCoordinate, PediatricHospital } from "../../types/hospital";
import HospitalList from "./HospitalList";
import HospitalMap from "./HospitalMap";

const DEFAULT_CENTER: MapCoordinate = { lat: 37.5007, lng: 127.0365 };

const sameArea = (left: MapCoordinate, right: MapCoordinate): boolean =>
  Math.abs(left.lat - right.lat) < 0.0003 && Math.abs(left.lng - right.lng) < 0.0003;

const HospitalHomeComponent = () => {
  const [userLocation, setUserLocation] = useState<MapCoordinate | null>(null);
  const [searchCenter, setSearchCenter] = useState(DEFAULT_CENTER);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [pendingCenter, setPendingCenter] = useState(DEFAULT_CENTER);
  const [focusKey, setFocusKey] = useState(0);
  const [hospitals, setHospitals] = useState<PediatricHospital[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(true);
  const [locationMessage, setLocationMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshingWaiting, setRefreshingWaiting] = useState(false);
  const [waitingMessage, setWaitingMessage] = useState("");

  const loadHospitals = useCallback(async (center: MapCoordinate) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const result = await getNearbyPediatricHospitals(center);
      setHospitals(result);
      setSelectedId(null);
    } catch (error: unknown) {
      setErrorMessage(
        axios.isAxiosError(error) && error.response?.status === 401
          ? "로그인 정보가 만료되었습니다. 다시 로그인해주세요."
          : "주변 소아과 정보를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const locateUser = useCallback(() => {
    if (!navigator.geolocation) {
      setLocating(false);
      setLoading(false);
      setLocationMessage("이 브라우저에서는 현재 위치를 사용할 수 없어요. 지도를 이동해 찾아보세요.");
      return;
    }

    setLocating(true);
    setLocationMessage("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = { lat: position.coords.latitude, lng: position.coords.longitude };
        const accuracy = Math.round(position.coords.accuracy);
        setUserLocation(location);
        setSearchCenter(location);
        setMapCenter(location);
        setPendingCenter(location);
        setFocusKey((value) => value + 1);
        setLocating(false);
        setLocationMessage(
          accuracy <= 500
            ? `현재 위치를 기준으로 가까운 소아과를 보여드리고 있어요. (오차 약 ${accuracy}m)`
            : `현재 위치의 정확도가 낮아요. (오차 약 ${accuracy.toLocaleString()}m) 기기의 위치 기능을 켜면 더 정확해져요.`,
        );
        void loadHospitals(location);
      },
      (error) => {
        setLocating(false);
        setLoading(false);
        setLocationMessage(
          error.code === error.PERMISSION_DENIED
            ? "위치 권한이 꺼져 있어요. 브라우저 설정에서 위치 권한을 허용하거나, 지도를 이동해 찾아보세요."
            : error.code === error.POSITION_UNAVAILABLE
              ? "현재 위치 정보를 확인할 수 없어요. 기기의 위치 기능을 켠 뒤 다시 시도해주세요."
              : "위치 확인 시간이 초과됐어요. 잠시 후 다시 시도해주세요.",
        );
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  }, [loadHospitals]);

  useEffect(() => {
    locateUser();
  }, [locateUser]);

  const handleSelect = useCallback((hospital: PediatricHospital) => {
    setSelectedId(hospital.hospitalId);
    setMapCenter({ lat: hospital.latitude, lng: hospital.longitude });
    setFocusKey((value) => value + 1);
  }, []);

  const handleCenterChange = useCallback((center: MapCoordinate) => {
    setPendingCenter(center);
  }, []);

  const searchPendingArea = () => {
    setSearchCenter(pendingCenter);
    void loadHospitals(pendingCenter);
  };

  const moveToCurrentLocation = () => {
    if (!userLocation) {
      locateUser();
      return;
    }
    setMapCenter(userLocation);
    setPendingCenter(userLocation);
    setFocusKey((value) => value + 1);
  };

  const refreshWaitingCounts = async () => {
    if (hospitals.length === 0 || refreshingWaiting) return;

    setRefreshingWaiting(true);
    setWaitingMessage("");
    try {
      const result = await refreshHospitalWaitingCounts(hospitals.map(({ hospitalId }) => hospitalId));
      const counts = new Map(result.hospitals.map((hospital) => [hospital.hospitalId, hospital]));
      setHospitals((current) =>
        current.map((hospital) => {
          const waiting = counts.get(hospital.hospitalId);
          return waiting ? { ...hospital, ...waiting } : hospital;
        }),
      );
      setWaitingMessage(
        result.refreshLimited
          ? `${result.retryAfterSeconds}초 후 다시 새로고침할 수 있어요.`
          : "대기 인원을 새로 확인했어요.",
      );
    } catch (error: unknown) {
      setWaitingMessage(
        axios.isAxiosError(error) && error.response?.status === 401
          ? "로그인 정보가 만료되었어요. 다시 로그인해주세요."
          : "대기 인원을 확인하지 못했어요. 잠시 후 다시 시도해주세요.",
      );
    } finally {
      setRefreshingWaiting(false);
    }
  };

  return (
    <section className="hospital-shell">
      <header className="hospital-heading">
        <div>
          <p className="eyebrow">NEARBY PEDIATRICS</p>
          <h1>우리 아이 주변 소아과</h1>
          <p className="desc">현재 위치에서 가까운 소아청소년과를 확인해보세요.</p>
        </div>
      </header>

      {locationMessage && <div className="hospital-location-message">{locationMessage}</div>}

      <div className="card">
      <div className="hospital-content">
        <div className="hospital-map-pane">
          <HospitalMap
            hospitals={hospitals}
            userLocation={userLocation}
            focusCenter={mapCenter}
            focusKey={focusKey}
            selectedId={selectedId}
            onSelect={handleSelect}
            onCenterChange={handleCenterChange}
          />
          <div className="hospital-map-actions">
            {!sameArea(searchCenter, pendingCenter) && (
              <button type="button" className="hospital-search-area-button" onClick={searchPendingArea}>
                이 지역에서 다시 찾기
              </button>
            )}
            <button
              type="button"
              className="hospital-search-area-button"
              disabled={locating}
              onClick={moveToCurrentLocation}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="7"/></svg>
              {locating ? "위치 확인 중..." : "현재 위치로 이동"}
            </button>
          </div>
        </div>

        <aside className="hospital-list-pane">
          <div className="hospital-list-heading">
            <label className="hospital-sort">
              <span className="sr-only">병원 정렬 기준</span>
              <select defaultValue="distance" aria-label="병원 정렬 기준">
                <option value="distance">가까운 순서</option>
              </select>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>
            </label>
            <h2>주변 소아과 <strong>{hospitals.length}곳</strong></h2>
          </div>
          <div className="hospital-waiting-controls">
            <button
              type="button"
              className="hospital-waiting-refresh"
              disabled={hospitals.length === 0 || refreshingWaiting}
              onClick={() => void refreshWaitingCounts()}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5"/><path d="M19 12a7 7 0 1 0-2 5"/></svg>
              {refreshingWaiting ? "확인 중..." : "대기 인원 새로고침"}
            </button>
            {waitingMessage && <p className="hospital-waiting-message">{waitingMessage}</p>}
          </div>
          <HospitalList
            hospitals={hospitals}
            selectedId={selectedId}
            loading={loading}
            errorMessage={errorMessage}
            userLocation={userLocation}
            onSelect={handleSelect}
            onRetry={() => void loadHospitals(searchCenter)}
          />
        </aside>
      </div>
      </div>
      <p className="hospital-data-notice">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>
        병원에서 제공한 정보로 실제 진료 및 대기 상황과 다를 수 있습니다. 방문 전 병원에 확인해주세요.
      </p>
    </section>
  );
};

export default HospitalHomeComponent;
