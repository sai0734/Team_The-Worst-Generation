import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as babysitterApi from "../../api/babysitterApi";

const BabysitterFormComponent = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [careerYears, setCareerYears] = useState("0");
  const [region, setRegion] = useState("");
  const [availableTime, setAvailableTime] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [intro, setIntro] = useState("");
  const [exists, setExists] = useState(false);

  useEffect(() => {
    babysitterApi
      .getMine()
      .then((profile) => {
        setName(profile.name);
        setCareerYears(String(profile.careerYears));
        setRegion(profile.region ?? "");
        setAvailableTime(profile.availableTime ?? "");
        setHourlyRate(profile.hourlyRate ? String(profile.hourlyRate) : "");
        setIntro(profile.intro ?? "");
        setExists(true);
      })
      .catch(() => {
        setExists(false);
      });
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await babysitterApi.save({
        name,
        careerYears: Number(careerYears) || 0,
        region: region || undefined,
        availableTime: availableTime || undefined,
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
        intro: intro || undefined,
      });

      alert("저장되었습니다.");
      navigate("/babysitter");
    } catch (err) {
      alert("저장에 실패했습니다.");
      console.error(err);
    }
  };

  const handleRemove = async () => {
    if (!confirm("시터 프로필을 삭제할까요?")) {
      return;
    }

    await babysitterApi.remove();
    alert("삭제되었습니다.");
    navigate("/babysitter");
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold">
        {exists ? "내 시터 프로필 수정" : "시터 프로필 등록"}
      </h2>

      <p>이름</p>
      <input value={name} onChange={(e) => setName(e.target.value)} required />

      <p>경력(년)</p>
      <input
        type="number"
        min={0}
        value={careerYears}
        onChange={(e) => setCareerYears(e.target.value)}
      />

      <p>활동 지역</p>
      <input value={region} onChange={(e) => setRegion(e.target.value)} />

      <p>가능시간</p>
      <input
        placeholder="예: 평일 오전 9시~오후 6시"
        value={availableTime}
        onChange={(e) => setAvailableTime(e.target.value)}
      />

      <p>시급</p>
      <input
        type="number"
        min={0}
        value={hourlyRate}
        onChange={(e) => setHourlyRate(e.target.value)}
      />

      <p>소개</p>
      <textarea value={intro} onChange={(e) => setIntro(e.target.value)} />

      <div className="flex gap-2 mt-3">
        <button type="submit">저장</button>
        {exists && (
          <button type="button" onClick={handleRemove}>
            프로필 삭제
          </button>
        )}
      </div>
    </form>
  );
};

export default BabysitterFormComponent;
