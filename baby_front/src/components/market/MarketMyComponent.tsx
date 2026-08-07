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
    return <div>불러오는 중...</div>;
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
    <div>
      <h2>내 감자밭</h2>
      <div>매너온도: {profile.mannerTemp}°C</div>
      <div>동네 인증: {profile.locationVerified ? "인증됨" : "미인증"}</div>

      <form onSubmit={handleSaveLocation}>
        <p>동네</p>
        <input
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
        />
        <button type="submit">저장</button>
        {!profile.locationVerified && (
          <button type="button" onClick={handleVerify}>
            동네 인증하기
          </button>
        )}
      </form>

      {/* TODO: 내가 등록한 매물 목록 — 백엔드에 "내 매물 조회" 엔드포인트 추가되면 연결 */}
    </div>
  );
};

export default MarketMyComponent;
