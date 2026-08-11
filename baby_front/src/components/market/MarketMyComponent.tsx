import { FormEvent, useEffect, useState } from "react";
import * as marketProfileApi from "../../api/marketProfileApi";
import type { MarketProfile } from "../../api/marketProfileApi";

const MarketMyComponent = () => {
  const [profile, setProfile] = useState<MarketProfile | null>(null);
  const [locationName, setLocationName] = useState("");

  const loadProfile = async () => {
    const data = await marketProfileApi.getMyProfile();
    setProfile(data);
    setLocationName(data.locationName ?? "");
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (!profile) {
    return <div className="card">불러오는 중...</div>;
  }

  const handleSaveLocation = async (e: FormEvent) => {
    e.preventDefault();
    await marketProfileApi.modifyProfile({ locationName });
    await loadProfile();
    alert("저장되었습니다.");
  };

  const handleVerify = async () => {
    await marketProfileApi.verifyLocation();
    await loadProfile();
    alert("동네 인증이 완료되었습니다.");
  };

  return (
    <div className="card" style={{ maxWidth: 480 }}>
      <h2 style={{ marginTop: 0 }}>내 감자밭</h2>
      <div className="detail-meta">매너온도: {profile.mannerTemp}°C</div>
      <div className="detail-meta">
        동네 인증:{" "}
        <span
          className={`status-badge ${profile.locationVerified ? "available" : "done"}`}
        >
          {profile.locationVerified ? "인증됨" : "미인증"}
        </span>
      </div>

      <form onSubmit={handleSaveLocation}>
        <div className="form-field">
          <label>동네</label>
          <input
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" className="btn">
            저장
          </button>
          {!profile.locationVerified && (
            <button type="button" className="btn ghost" onClick={handleVerify}>
              동네 인증하기
            </button>
          )}
        </div>
      </form>

      {/* TODO: 내가 등록한 매물 목록 — 백엔드에 "내 매물 조회" 엔드포인트 추가되면 연결 */}
    </div>
  );
};

export default MarketMyComponent;
