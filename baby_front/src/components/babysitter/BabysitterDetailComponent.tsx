import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as babysitterApi from "../../api/babysitterApi";
import type { BabysitterProfile } from "../../api/babysitterApi";
import useCustomLogin from "../../hooks/useCustomLogin";

const BabysitterDetailComponent = () => {
  const { email } = useParams();
  const navigate = useNavigate();
  const { loginState } = useCustomLogin();

  const [profile, setProfile] = useState<BabysitterProfile | null>(null);

  useEffect(() => {
    if (!email) {
      return;
    }

    babysitterApi.getOne(email).then(setProfile);
  }, [email]);

  if (!profile) {
    return <div>불러오는 중...</div>;
  }

  const isMine = loginState.email === profile.email;

  return (
    <div>
      <h2 className="text-xl font-bold">{profile.name}</h2>
      <div>경력 {profile.careerYears}년</div>
      <div>지역: {profile.region ?? "미입력"}</div>
      <div>가능시간: {profile.availableTime ?? "미입력"}</div>
      <div>
        시급: {profile.hourlyRate ? `${profile.hourlyRate.toLocaleString()}원` : "협의"}
      </div>
      <p className="whitespace-pre-wrap">{profile.intro}</p>

      {isMine && (
        <button onClick={() => navigate("/babysitter/me/edit")}>
          내 프로필 수정
        </button>
      )}

      <div>
        <button onClick={() => navigate("/babysitter")}>목록으로</button>
      </div>
    </div>
  );
};

export default BabysitterDetailComponent;
