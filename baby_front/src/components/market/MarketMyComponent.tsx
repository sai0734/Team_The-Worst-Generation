import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as marketProfileApi from "../../api/marketProfileApi";
import type { MarketProfile } from "../../api/marketProfileApi";
import MarketLocationPicker from "./MarketLocationPicker.tsx";
import useCustomLogin from "../../hooks/useCustomLogin";

const MarketMyComponent = () => {
  const navigate = useNavigate();
  const { isLogin } = useCustomLogin();
  const [profile, setProfile] = useState<MarketProfile | null>(null);
  const [editingLocation, setEditingLocation] = useState(false);

  const loadProfile = async () => {
    const data = await marketProfileApi.getMyProfile();
    setProfile(data);
  };

  useEffect(() => {
    if (!isLogin) {
      return;
    }
    loadProfile();
  }, [isLogin]);

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

  if (!profile) {
    return <div className="card">불러오는 중...</div>;
  }

  const handleConfirmLocation = async (
    locationName: string,
    lat: number,
    lng: number,
  ) => {
    await marketProfileApi.modifyProfile({
      locationName,
      latitude: lat,
      longitude: lng,
    });
    await marketProfileApi.verifyLocation();
    await loadProfile();
    setEditingLocation(false);
    alert("동네가 설정되었습니다.");
  };

  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <h2 style={{ marginTop: 0 }}>내 감자밭</h2>
      <div className="detail-meta">매너온도: {profile.mannerTemp}°C</div>
      <div className="detail-meta">
        내 동네: {profile.locationName || "설정 안 됨"}{" "}
        <span
          className={`status-badge ${profile.locationVerified ? "available" : "done"}`}
        >
          {profile.locationVerified ? "인증됨" : "미인증"}
        </span>
      </div>

      {editingLocation ? (
        <MarketLocationPicker
          initialLat={profile.latitude}
          initialLng={profile.longitude}
          onConfirm={handleConfirmLocation}
        />
      ) : (
        <button
          type="button"
          className="btn ghost"
          onClick={() => setEditingLocation(true)}
        >
          {profile.locationName ? "동네 다시 설정" : "동네 설정하기"}
        </button>
      )}

      {/* TODO: 내가 등록한 매물 목록 — 백엔드에 "내 매물 조회" 엔드포인트 추가되면 연결 */}
    </div>
  );
};

export default MarketMyComponent;
