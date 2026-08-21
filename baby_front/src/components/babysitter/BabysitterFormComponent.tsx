import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as babysitterApi from "../../api/babysitterApi";
import {
  DAY_OF_WEEK_LABELS,
  TIME_SLOT_LABELS,
} from "../../api/babysitterApi";
import type { DayOfWeek, TimeSlot } from "../../api/babysitterApi";
import { loadKakaoMapScript } from "../../util/kakaoMapLoader";

const describeError = (err: any): string =>
  err?.response?.data?.error ||
  err?.response?.data?.msg ||
  err?.message ||
  "알 수 없는 오류";

// 좌표 -> 동네 이름(구/동) 역지오코딩. 사용자가 직접 지역을 타이핑하지 못하게 하고
// 반드시 GPS로 확인된 위치에서만 활동 지역이 정해지도록 강제하기 위함.
const resolveRegionName = (lat: number, lng: number): Promise<string> =>
  new Promise((resolve, reject) => {
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.coord2Address(lng, lat, (result: any[], status: string) => {
      if (status === window.kakao.maps.services.Status.OK && result[0]) {
        const addr = result[0].address;
        resolve(`${addr.region_2depth_name} ${addr.region_3depth_name}`.trim());
      } else {
        reject(new Error("주소를 찾을 수 없습니다."));
      }
    });
  });

const DAYS = Object.keys(DAY_OF_WEEK_LABELS) as DayOfWeek[];
const SLOTS = Object.keys(TIME_SLOT_LABELS) as TimeSlot[];

const slotKey = (day: DayOfWeek, slot: TimeSlot) => `${day}-${slot}`;

const BabysitterFormComponent = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [careerYears, setCareerYears] = useState("0");
  const [region, setRegion] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [locating, setLocating] = useState(false);
  const [availableTime, setAvailableTime] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [intro, setIntro] = useState("");
  const [exists, setExists] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);
  // 아직 프로필이 없어(row가 없어) 바로 업로드할 수 없는 신규 등록 상태에서,
  // 선택한 파일을 들고 있다가 save() 성공 직후 업로드하기 위한 임시 보관.
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  const pendingPhotoPreview = useMemo(
    () => (pendingPhotoFile ? URL.createObjectURL(pendingPhotoFile) : null),
    [pendingPhotoFile],
  );
  useEffect(() => {
    return () => {
      if (pendingPhotoPreview) {
        URL.revokeObjectURL(pendingPhotoPreview);
      }
    };
  }, [pendingPhotoPreview]);

  useEffect(() => {
    babysitterApi
      .getMine()
      .then((profile) => {
        setName(profile.name);
        setCareerYears(String(profile.careerYears));
        setRegion(profile.region ?? "");
        setLatitude(profile.latitude ?? undefined);
        setLongitude(profile.longitude ?? undefined);
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

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("이 브라우저는 위치 기능을 지원하지 않습니다.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;

        try {
          await loadKakaoMapScript();
          const resolvedRegion = await resolveRegionName(lat, lng);
          setRegion(resolvedRegion);
          setLatitude(lat);
          setLongitude(lng);
        } catch (err) {
          console.error(err);
          alert("위치는 확인했지만 동네 이름을 가져오지 못했습니다. 다시 시도해주세요.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        alert("위치 정보를 가져오지 못했습니다. 브라우저 위치 권한을 허용해주세요.");
        setLocating(false);
      },
    );
  };

  const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (!exists) {
      // 프로필이 아직 없으면 업로드 endpoint가 404를 내므로, 저장 성공 직후 올리도록 보관만 함.
      setPendingPhotoFile(file);
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

    if (!region || latitude == null || longitude == null) {
      alert("활동 지역은 위치 설정 버튼으로만 등록할 수 있어요. 먼저 '현재 위치로 설정'을 눌러주세요.");
      return;
    }

    if (!photoFileName && !pendingPhotoFile) {
      alert("프로필 사진은 필수예요. 사진을 선택해주세요.");
      return;
    }

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
        latitude,
        longitude,
        availableTime: availableTime || undefined,
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
        intro: intro || undefined,
        availability,
      });

      if (pendingPhotoFile) {
        await babysitterApi.uploadPhoto(pendingPhotoFile);
      }

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
    <form onSubmit={handleSubmit} className="recall-form">
      <h2 className="page-title" style={{ margin: 0 }}>
        {exists ? "내 시터 프로필 수정" : "시터 프로필 등록"}
      </h2>

      <div className="field">
        <label>프로필 사진 (필수)</label>
        {(pendingPhotoPreview || photoFileName) && (
          <img
            src={pendingPhotoPreview ?? babysitterApi.getFileUrl(photoFileName!)}
            className="sitter-avatar-lg"
            style={{ marginBottom: 8 }}
          />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          disabled={photoUploading}
          required={!photoFileName && !pendingPhotoFile}
        />
        {!exists && (
          <p className="field-hint">
            선택한 사진은 등록과 동시에 함께 저장돼요.
          </p>
        )}
      </div>

      <div className="field">
        <label>이름</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="field">
        <label>경력(년)</label>
        <input
          type="number"
          min={0}
          value={careerYears}
          onChange={(e) => setCareerYears(e.target.value)}
        />
      </div>

      <div className="field">
        <label>활동 지역 (직접 입력 불가 - 현재 위치로만 설정됩니다)</label>
        <div className="sitter-actions" style={{ margin: 0, alignItems: "center" }}>
          <button
            type="button"
            className="btn ghost"
            onClick={handleUseCurrentLocation}
            disabled={locating}
          >
            {locating ? "위치 확인 중..." : region ? "위치 다시 설정" : "현재 위치로 설정"}
          </button>
          {region && (
            <span className="meta">
              {region} ({latitude?.toFixed(5)}, {longitude?.toFixed(5)})
            </span>
          )}
        </div>
        {!region && (
          <p className="field-hint">
            신뢰를 위해 활동 지역은 위치 설정 버튼으로만 등록할 수 있어요.
          </p>
        )}
      </div>

      <div className="field">
        <label>가능 요일/시간대 (체크한 칸이 가능시간으로 검색에 노출됩니다)</label>
        <table className="sitter-availability-table">
          <thead>
            <tr>
              <th></th>
              {DAYS.map((day) => (
                <th key={day}>{DAY_OF_WEEK_LABELS[day]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SLOTS.map((slot) => (
              <tr key={slot}>
                <td>{TIME_SLOT_LABELS[slot]}</td>
                {DAYS.map((day) => (
                  <td key={day}>
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
      </div>

      <div className="field">
        <label>가능시간 보충 설명 (선택)</label>
        <input
          placeholder="예: 급한 연락은 문자로 부탁드려요"
          value={availableTime}
          onChange={(e) => setAvailableTime(e.target.value)}
        />
      </div>

      <div className="field">
        <label>시급</label>
        <input
          type="number"
          min={0}
          value={hourlyRate}
          onChange={(e) => setHourlyRate(e.target.value)}
        />
      </div>

      <div className="field">
        <label>소개</label>
        <textarea
          className="bulk-input"
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
        />
      </div>

      <div className="sitter-actions">
        <button type="submit" className="submit-btn" style={{ flex: 1 }}>
          저장
        </button>
        {exists && (
          <button type="button" className="btn ghost" onClick={handleRemove}>
            프로필 삭제
          </button>
        )}
      </div>
    </form>
  );
};

export default BabysitterFormComponent;
