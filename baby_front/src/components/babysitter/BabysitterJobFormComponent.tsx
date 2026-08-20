import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as babysitterApi from "../../api/babysitterApi";
import { DAY_OF_WEEK_LABELS, TIME_SLOT_LABELS } from "../../api/babysitterApi";
import type { DayOfWeek, TimeSlot } from "../../api/babysitterApi";
import { loadKakaoMapScript } from "../../util/kakaoMapLoader";

const DAYS = Object.keys(DAY_OF_WEEK_LABELS) as DayOfWeek[];

const describeError = (err: any): string =>
  err?.response?.data?.error ||
  err?.response?.data?.msg ||
  err?.message ||
  "알 수 없는 오류";

// 좌표 -> 동네 이름(구/동) 역지오코딩. 부모가 직접 지역을 타이핑하지 못하게 하고
// 반드시 GPS로 확인된 위치에서만 구인글 지역이 정해지도록 강제하기 위함.
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

const BabysitterJobFormComponent = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [region, setRegion] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [locating, setLocating] = useState(false);
  const [desiredDays, setDesiredDays] = useState<Set<DayOfWeek>>(new Set());
  const [timeSlot, setTimeSlot] = useState<TimeSlot>("MORNING");
  const [hourlyRate, setHourlyRate] = useState("");
  const [message, setMessage] = useState("");

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

  const toggleDay = (day: DayOfWeek) => {
    setDesiredDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!region || latitude == null || longitude == null) {
      alert("지역은 위치 설정 버튼으로만 등록할 수 있어요. 먼저 '현재 위치로 설정'을 눌러주세요.");
      return;
    }

    if (desiredDays.size === 0) {
      alert("희망 요일을 하나 이상 선택해주세요.");
      return;
    }

    try {
      const result = await babysitterApi.registerJobPost({
        title,
        region,
        latitude,
        longitude,
        desiredDays: Array.from(desiredDays),
        timeSlot,
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
        message: message || undefined,
      });

      alert("구인글을 등록했습니다.");
      navigate(`/community/babysitter/jobs/${result.jobNo}`);
    } catch (err) {
      console.error(err);
      alert(`등록에 실패했습니다.\n(${describeError(err)})`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="recall-form">
      <h2 className="page-title" style={{ margin: 0 }}>돌봄 구인글 작성</h2>

      <div className="field">
        <label>제목</label>
        <input
          placeholder="예: 8/15 저녁에 2시간 봐주실 분 구해요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label>지역 (직접 입력 불가 - 현재 위치로만 설정됩니다)</label>
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
            신뢰를 위해 구인글 지역은 위치 설정 버튼으로만 등록할 수 있어요.
          </p>
        )}
      </div>

      <div className="field">
        <label>희망 요일 (여러 개 선택 가능)</label>
        <div className="seg">
          {DAYS.map((day) => (
            <button
              key={day}
              type="button"
              className={desiredDays.has(day) ? "is-active" : ""}
              onClick={() => toggleDay(day)}
            >
              {DAY_OF_WEEK_LABELS[day]}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>시간대</label>
        <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value as TimeSlot)}>
          {(Object.keys(TIME_SLOT_LABELS) as TimeSlot[]).map((slot) => (
            <option key={slot} value={slot}>
              {TIME_SLOT_LABELS[slot]}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>제시 시급 (선택)</label>
        <input
          type="number"
          min={0}
          value={hourlyRate}
          onChange={(e) => setHourlyRate(e.target.value)}
        />
      </div>

      <div className="field">
        <label>상세 내용</label>
        <textarea className="bulk-input" value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>

      <button type="submit" className="submit-btn">
        등록
      </button>
    </form>
  );
};

export default BabysitterJobFormComponent;
