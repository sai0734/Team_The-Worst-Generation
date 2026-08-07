import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as babysitterApi from "../../api/babysitterApi";
import {
  DAY_OF_WEEK_LABELS,
  GRADE_LABELS,
  TIME_SLOT_LABELS,
} from "../../api/babysitterApi";
import type { BabysitterProfile, DayOfWeek } from "../../api/babysitterApi";
import useCustomLogin from "../../hooks/useCustomLogin";

const DAYS = Object.keys(DAY_OF_WEEK_LABELS) as DayOfWeek[];

const BabysitterDetailComponent = () => {
  const { email } = useParams();
  const navigate = useNavigate();
  const { isLogin, loginState } = useCustomLogin();

  const [profile, setProfile] = useState<BabysitterProfile | null>(null);
  const [picked, setPicked] = useState(false);
  const [pickCount, setPickCount] = useState(0);

  useEffect(() => {
    if (!email) {
      return;
    }

    babysitterApi.getOne(email).then((p) => {
      setProfile(p);
      setPickCount(p.pickCount);
    });

    if (isLogin && loginState.email !== email) {
      babysitterApi.isPicked(email).then(setPicked);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  if (!profile || !email) {
    return <div>불러오는 중...</div>;
  }

  const isMine = loginState.email === profile.email;

  const handleTogglePick = async () => {
    try {
      const res = await babysitterApi.togglePick(email);
      setPicked(res.picked);
      setPickCount((prev) => prev + (res.picked ? 1 : -1));
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.error || err?.response?.data?.msg || "실패했습니다.");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold">
        {profile.name}{" "}
        <span className="text-sm bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
          {GRADE_LABELS[profile.grade]}
        </span>
      </h2>

      <div className="my-1">
        픽 {pickCount}명
        {isLogin && !isMine && (
          <button onClick={handleTogglePick} className="ml-2">
            {picked ? "픽 취소" : "픽하기"}
          </button>
        )}
      </div>

      <div>경력 {profile.careerYears}년</div>
      <div>지역: {profile.region ?? "미입력"}</div>

      <div className="my-2">
        가능 요일/시간대:{" "}
        {profile.availability.length === 0 ? (
          "미입력"
        ) : (
          DAYS.filter((day) =>
            profile.availability.some((a) => a.dayOfWeek === day),
          )
            .map(
              (day) =>
                `${DAY_OF_WEEK_LABELS[day]}(${profile.availability
                  .filter((a) => a.dayOfWeek === day)
                  .map((a) => TIME_SLOT_LABELS[a.timeSlot])
                  .join("/")})`,
            )
            .join(", ")
        )}
      </div>

      {profile.availableTime && <div>참고: {profile.availableTime}</div>}
      <div>
        시급: {profile.hourlyRate ? `${profile.hourlyRate.toLocaleString()}원` : "협의"}
      </div>
      <p className="whitespace-pre-wrap">{profile.intro}</p>

      {isMine && (
        <button onClick={() => navigate("/community/babysitter/me/edit")}>
          내 프로필 수정
        </button>
      )}

      <div>
        <button onClick={() => navigate("/community/babysitter")}>목록으로</button>
      </div>
    </div>
  );
};

export default BabysitterDetailComponent;
