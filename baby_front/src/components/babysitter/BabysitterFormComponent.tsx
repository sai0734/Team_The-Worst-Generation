import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as babysitterApi from "../../api/babysitterApi";
import {
  DAY_OF_WEEK_LABELS,
  TIME_SLOT_LABELS,
} from "../../api/babysitterApi";
import type { DayOfWeek, TimeSlot } from "../../api/babysitterApi";

const describeError = (err: any): string =>
  err?.response?.data?.error ||
  err?.response?.data?.msg ||
  err?.message ||
  "알 수 없는 오류";

const DAYS = Object.keys(DAY_OF_WEEK_LABELS) as DayOfWeek[];
const SLOTS = Object.keys(TIME_SLOT_LABELS) as TimeSlot[];

const slotKey = (day: DayOfWeek, slot: TimeSlot) => `${day}-${slot}`;

const BabysitterFormComponent = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [careerYears, setCareerYears] = useState("0");
  const [region, setRegion] = useState("");
  const [availableTime, setAvailableTime] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [intro, setIntro] = useState("");
  const [exists, setExists] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

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
        setSelectedSlots(
          new Set(profile.availability.map((a) => slotKey(a.dayOfWeek, a.timeSlot))),
        );
        setPhotoFileName(profile.profileImageFileName);
        setExists(true);
      })
      .catch(() => {
        setExists(false);
      });
  }, []);

  const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setPhotoUploading(true);
    try {
      const res = await babysitterApi.uploadPhoto(file);
      setPhotoFileName(res.fileName);
    } catch (err) {
      console.error(err);
      alert(`사진 업로드에 실패했습니다.\n(${describeError(err)})`);
    } finally {
      setPhotoUploading(false);
    }
  };

  const toggleSlot = (day: DayOfWeek, slot: TimeSlot) => {
    const key = slotKey(day, slot);
    setSelectedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const availability = DAYS.flatMap((day) =>
        SLOTS.filter((slot) => selectedSlots.has(slotKey(day, slot))).map((slot) => ({
          dayOfWeek: day,
          timeSlot: slot,
        })),
      );

      await babysitterApi.save({
        name,
        careerYears: Number(careerYears) || 0,
        region: region || undefined,
        availableTime: availableTime || undefined,
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
        intro: intro || undefined,
        availability,
      });

      alert("저장되었습니다.");
      navigate("/community/babysitter");
    } catch (err) {
      console.error(err);
      alert(`저장에 실패했습니다.\n(${describeError(err)})`);
    }
  };

  const handleRemove = async () => {
    if (!confirm("시터 프로필을 삭제할까요?")) {
      return;
    }

    try {
      await babysitterApi.remove();
      alert("삭제되었습니다.");
      navigate("/community/babysitter");
    } catch (err) {
      console.error(err);
      alert(`삭제에 실패했습니다.\n(${describeError(err)})`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold">
        {exists ? "내 시터 프로필 수정" : "시터 프로필 등록"}
      </h2>

      {exists ? (
        <div className="my-2">
          <p>프로필 사진</p>
          {photoFileName && (
            <img
              src={babysitterApi.getFileUrl(photoFileName)}
              className="w-24 h-24 rounded-full object-cover mb-1"
            />
          )}
          <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={photoUploading} />
        </div>
      ) : (
        <p className="text-sm text-gray-500 my-2">
          프로필 사진은 먼저 저장한 뒤 업로드할 수 있습니다.
        </p>
      )}

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

      <p>가능 요일/시간대 (체크한 칸이 가능시간으로 검색에 노출됩니다)</p>
      <table className="border-collapse">
        <thead>
          <tr>
            <th></th>
            {DAYS.map((day) => (
              <th key={day} className="px-2">
                {DAY_OF_WEEK_LABELS[day]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SLOTS.map((slot) => (
            <tr key={slot}>
              <td className="pr-2">{TIME_SLOT_LABELS[slot]}</td>
              {DAYS.map((day) => (
                <td key={day} className="text-center">
                  <input
                    type="checkbox"
                    checked={selectedSlots.has(slotKey(day, slot))}
                    onChange={() => toggleSlot(day, slot)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <p>가능시간 보충 설명 (선택)</p>
      <input
        placeholder="예: 급한 연락은 문자로 부탁드려요"
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
