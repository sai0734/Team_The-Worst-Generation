import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as babysitterApi from "../../api/babysitterApi";
import { TIME_SLOT_LABELS } from "../../api/babysitterApi";
import type { TimeSlot } from "../../api/babysitterApi";

const describeError = (err: any): string =>
  err?.response?.data?.error ||
  err?.response?.data?.msg ||
  err?.message ||
  "알 수 없는 오류";

const BabysitterJobFormComponent = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [region, setRegion] = useState("");
  const [desiredDate, setDesiredDate] = useState("");
  const [timeSlot, setTimeSlot] = useState<TimeSlot>("MORNING");
  const [hourlyRate, setHourlyRate] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const result = await babysitterApi.registerJobPost({
        title,
        region: region || undefined,
        desiredDate,
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
    <form onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold">돌봄 구인글 작성</h2>

      <p>제목</p>
      <input
        placeholder="예: 8/15 저녁에 2시간 봐주실 분 구해요"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <p>지역</p>
      <input value={region} onChange={(e) => setRegion(e.target.value)} />

      <p>희망 날짜</p>
      <input
        type="date"
        value={desiredDate}
        onChange={(e) => setDesiredDate(e.target.value)}
        required
      />

      <p>시간대</p>
      <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value as TimeSlot)}>
        {(Object.keys(TIME_SLOT_LABELS) as TimeSlot[]).map((slot) => (
          <option key={slot} value={slot}>
            {TIME_SLOT_LABELS[slot]}
          </option>
        ))}
      </select>

      <p>제시 시급 (선택)</p>
      <input
        type="number"
        min={0}
        value={hourlyRate}
        onChange={(e) => setHourlyRate(e.target.value)}
      />

      <p>상세 내용</p>
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} />

      <div className="mt-3">
        <button type="submit">등록</button>
      </div>
    </form>
  );
};

export default BabysitterJobFormComponent;
