import axios from "axios";
import { FormEvent, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { registerHospitalReservation } from "../../api/hospitalApi";
import type {
  HospitalReservationLocationState,
  PediatricHospital,
} from "../../types/hospital";

const PHONE_PATTERN = /^01[016789][0-9]{7,8}$/;

const todayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseHHmm = (value: string | null): number | null => {
  if (!value || value.length !== 4) return null;
  const hours = Number(value.slice(0, 2));
  const minutes = Number(value.slice(2));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const formatMinutes = (total: number) => {
  const hours = String(Math.floor(total / 60)).padStart(2, "0");
  const minutes = String(total % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const buildTimeSlots = (hospital: PediatricHospital) => {
  const start = parseHHmm(hospital.startTime) ?? 9 * 60;
  const end = parseHHmm(hospital.endTime) ?? 18 * 60;
  const slots: string[] = [];

  for (let time = start; time + 30 <= end; time += 30) {
    slots.push(formatMinutes(time));
  }

  if (slots.length === 0) {
    for (let time = 9 * 60; time < 18 * 60; time += 30) {
      slots.push(formatMinutes(time));
    }
  }

  return slots;
};

const monthsFromBirthDate = (birthDate: string) => {
  if (!birthDate) return "";
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return "";
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  return String(Math.max(0, months));
};

const isPastSlot = (date: string, time: string) => {
  if (date !== todayString()) return false;
  const [hours, minutes] = time.split(":").map(Number);
  const slot = new Date();
  slot.setHours(hours, minutes, 0, 0);
  return slot.getTime() <= Date.now();
};

const normalizePhone = (value: string) => value.replace(/\D/g, "");

const describeError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.msg;
    if (typeof message === "string" && message.trim()) return message;
    if (error.response?.status === 401) {
      return "로그인 정보가 만료되었어요. 다시 로그인해주세요.";
    }
  }
  return "예약을 접수하지 못했어요. 잠시 후 다시 시도해주세요.";
};

const HospitalReservationComponent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hospital = (location.state as HospitalReservationLocationState | null)?.hospital;

  const [reservationDate, setReservationDate] = useState(todayString());
  const [reservationTime, setReservationTime] = useState("");
  const [babyName, setBabyName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [ageMonths, setAgeMonths] = useState("");
  const [gender, setGender] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [birthWeekCount, setBirthWeekCount] = useState("");
  const [birthWeight, setBirthWeight] = useState("");
  const [birthHeight, setBirthHeight] = useState("");
  const [headCircumference, setHeadCircumference] = useState("");
  const [notificationPhone, setNotificationPhone] = useState("");
  const [conditions, setConditions] = useState("");
  const [allergies, setAllergies] = useState("");
  const [visitReason, setVisitReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [reservationNo, setReservationNo] = useState<number | null>(null);

  const timeSlots = useMemo(
    () => (hospital ? buildTimeSlots(hospital) : []),
    [hospital],
  );

  const buildMessage = () => {
    const lines: string[] = [];
    if (visitReason.trim()) lines.push(`방문 사유: ${visitReason.trim()}`);
    if (conditions.trim()) lines.push(`평소 질환: ${conditions.trim()}`);
    if (allergies.trim()) lines.push(`알러지: ${allergies.trim()}`);

    const babyBits = [
      ageMonths.trim() ? `${ageMonths.trim()}개월` : "",
      gender,
      bloodType ? `${bloodType}형` : "",
      birthDate ? `생년월일 ${birthDate}` : "",
      birthWeekCount.trim() ? `출생 ${birthWeekCount.trim()}주` : "",
      birthWeight.trim() ? `출생 체중 ${birthWeight.trim()}kg` : "",
      birthHeight.trim() ? `출생 키 ${birthHeight.trim()}cm` : "",
      headCircumference.trim() ? `머리둘레 ${headCircumference.trim()}cm` : "",
    ].filter(Boolean);

    if (babyBits.length > 0) {
      lines.push(`아기 정보: ${babyBits.join(" / ")}`);
    }

    return lines.join("\n");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hospital || submitting) return;

    const phone = normalizePhone(notificationPhone);
    if (!babyName.trim()) {
      setErrorMessage("아이 이름을 입력해주세요.");
      return;
    }
    if (!reservationTime) {
      setErrorMessage("예약 시간을 선택해주세요.");
      return;
    }
    if (isPastSlot(reservationDate, reservationTime)) {
      setErrorMessage("지난 시간은 예약할 수 없어요.");
      return;
    }
    if (!PHONE_PATTERN.test(phone)) {
      setErrorMessage("올바른 보호자 휴대전화 번호를 입력해주세요.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const result = await registerHospitalReservation({
        hospitalId: hospital.hospitalId,
        hospitalName: hospital.hospitalName,
        hospitalType: hospital.hospitalType || "소아청소년과",
        hospitalAddress: hospital.address,
        hospitalPhone: hospital.mainPhone ?? undefined,
        notificationPhone: phone,
        reservationDate,
        reservationTime,
        patientName: babyName.trim(),
        message: buildMessage() || undefined,
      });
      setReservationNo(result.reservationNo);
    } catch (error: unknown) {
      setErrorMessage(describeError(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (!hospital) {
    return (
      <section className="hospital-shell">
        <header className="hospital-heading">
          <div>
            <p className="eyebrow">HOSPITAL RESERVATION</p>
            <h1>진료 예약</h1>
            <p className="desc">예약할 병원을 먼저 골라주세요.</p>
          </div>
        </header>
        <div className="hospital-reservation-empty">
          <p>주변 소아과 목록에서 병원을 선택한 뒤 예약하기를 눌러주세요.</p>
          <Link to="/hospital" className="submit-btn">소아과 찾기로 이동</Link>
        </div>
      </section>
    );
  }

  if (reservationNo != null) {
    return (
      <section className="hospital-shell">
        <header className="hospital-heading">
          <div>
            <p className="eyebrow">RESERVATION RECEIVED</p>
            <h1>예약이 접수되었어요</h1>
            <p className="desc">병원에 확인한 뒤, 입력하신 번호로 문자 연락드립니다.</p>
          </div>
        </header>

        <div className="hospital-reservation-done">
          <ol className="hospital-reservation-steps">
            <li className="is-done">
              <strong>1</strong>
              <span>예약 접수 완료</span>
            </li>
            <li className="is-current">
              <strong>2</strong>
              <span>병원에 연락</span>
            </li>
            <li>
              <strong>3</strong>
              <span>문자로 결과 안내</span>
            </li>
          </ol>

          <article className="hospital-reservation-summary">
            <p className="hospital-reservation-kicker">접수 내용</p>
            <h2>{hospital.hospitalName}</h2>
            <dl>
              <div>
                <dt>예약 번호</dt>
                <dd>{reservationNo}</dd>
              </div>
              <div>
                <dt>방문 일시</dt>
                <dd>
                  {reservationDate} {reservationTime}
                </dd>
              </div>
              <div>
                <dt>아이</dt>
                <dd>{babyName.trim()}</dd>
              </div>
              <div>
                <dt>보호자 번호</dt>
                <dd>{normalizePhone(notificationPhone)}</dd>
              </div>
            </dl>
            <p className="hospital-reservation-notice">
              지금은 접수 단계입니다. 확정 여부는 병원에서 확인한 뒤 문자로 알려드려요.
            </p>
          </article>

          <div className="hospital-reservation-done-actions">
            <button type="button" className="ghost-btn" onClick={() => navigate("/hospital")}>
              소아과 찾기로
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="hospital-shell">
      <header className="hospital-heading">
        <div>
          <p className="eyebrow">HOSPITAL RESERVATION</p>
          <h1>진료 예약</h1>
          <p className="desc">아이 정보와 보호자 번호를 남기면 병원에서 확인 후 문자로 연락드립니다.</p>
        </div>
      </header>

      <div className="hospital-reservation-content">
        <aside className="hospital-reservation-hospital">
          <p className="hospital-reservation-kicker">선택한 병원</p>
          <h2>{hospital.hospitalName}</h2>
          <span className="hospital-type">소아청소년과</span>
          <p className="hospital-address">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            <span>{hospital.address}</span>
          </p>
          {hospital.mainPhone && <p className="hospital-reservation-phone">{hospital.mainPhone}</p>}
          <button type="button" className="ghost-btn" onClick={() => navigate("/hospital")}>
            병원 다시 선택
          </button>
        </aside>

        <form className="hospital-reservation-form" onSubmit={handleSubmit}>
          <section className="hospital-reservation-block">
            <h3>방문 일정</h3>
            <div className="hospital-reservation-grid">
              <label className="field">
                <span>예약 날짜</span>
                <input
                  type="date"
                  min={todayString()}
                  value={reservationDate}
                  onChange={(event) => {
                    setReservationDate(event.target.value);
                    setReservationTime("");
                  }}
                  required
                />
              </label>
              <label className="field">
                <span>예약 시간</span>
                <select
                  value={reservationTime}
                  onChange={(event) => setReservationTime(event.target.value)}
                  required
                >
                  <option value="">시간을 선택하세요</option>
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot} disabled={isPastSlot(reservationDate, slot)}>
                      {slot}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="hospital-reservation-block">
            <h3>아이 정보</h3>
            <p className="hospital-reservation-hint">아이 등록 정보에 있는 항목을 직접 입력할 수 있어요.</p>
            <label className="field">
              <span>이름</span>
              <input
                value={babyName}
                onChange={(event) => setBabyName(event.target.value)}
                placeholder="아이 이름"
                required
              />
            </label>
            <div className="hospital-reservation-grid">
              <label className="field">
                <span>생년월일</span>
                <input
                  type="date"
                  max={todayString()}
                  value={birthDate}
                  onChange={(event) => {
                    const next = event.target.value;
                    setBirthDate(next);
                    setAgeMonths(monthsFromBirthDate(next));
                  }}
                />
              </label>
              <label className="field">
                <span>나이 (개월)</span>
                <input
                  inputMode="numeric"
                  value={ageMonths}
                  onChange={(event) => setAgeMonths(event.target.value)}
                  placeholder="예: 14"
                />
              </label>
            </div>
            <div className="field">
              <span>성별</span>
              <div className="hospital-reservation-pills">
                {["남자", "여자"].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={gender === value ? "is-active" : ""}
                    onClick={() => setGender(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            <div className="hospital-reservation-grid">
              <label className="field">
                <span>혈액형</span>
                <select value={bloodType} onChange={(event) => setBloodType(event.target.value)}>
                  <option value="">선택 안 함</option>
                  <option value="A">A형</option>
                  <option value="B">B형</option>
                  <option value="AB">AB형</option>
                  <option value="O">O형</option>
                </select>
              </label>
              <label className="field">
                <span>출생 주수</span>
                <input
                  value={birthWeekCount}
                  onChange={(event) => setBirthWeekCount(event.target.value)}
                  placeholder="예: 38"
                />
              </label>
            </div>
            <div className="hospital-reservation-grid hospital-reservation-grid-3">
              <label className="field">
                <span>출생 시 체중(kg)</span>
                <input
                  value={birthWeight}
                  onChange={(event) => setBirthWeight(event.target.value)}
                  placeholder="예: 3.2"
                />
              </label>
              <label className="field">
                <span>출생 시 키(cm)</span>
                <input
                  value={birthHeight}
                  onChange={(event) => setBirthHeight(event.target.value)}
                  placeholder="예: 50"
                />
              </label>
              <label className="field">
                <span>머리둘레(cm)</span>
                <input
                  value={headCircumference}
                  onChange={(event) => setHeadCircumference(event.target.value)}
                  placeholder="예: 34"
                />
              </label>
            </div>
          </section>

          <section className="hospital-reservation-block">
            <h3>보호자 연락처</h3>
            <label className="field">
              <span>문자 받을 번호</span>
              <input
                type="tel"
                inputMode="tel"
                value={notificationPhone}
                onChange={(event) => setNotificationPhone(event.target.value)}
                placeholder="010-1234-5678"
                required
              />
            </label>
            <p className="hospital-reservation-hint">예약 확인 문자가 이 번호로 발송됩니다.</p>
          </section>

          <section className="hospital-reservation-block">
            <h3>진료 메모</h3>
            <label className="field">
              <span>방문 사유</span>
              <textarea
                rows={3}
                value={visitReason}
                onChange={(event) => setVisitReason(event.target.value)}
                placeholder="발열, 접종, 정기 검진 등"
              />
            </label>
            <label className="field">
              <span>평소 질환</span>
              <textarea
                rows={2}
                value={conditions}
                onChange={(event) => setConditions(event.target.value)}
                placeholder="있다면 적어주세요"
              />
            </label>
            <label className="field">
              <span>알러지</span>
              <textarea
                rows={2}
                value={allergies}
                onChange={(event) => setAllergies(event.target.value)}
                placeholder="음식, 약물, 기타 알러지"
              />
            </label>
          </section>

          {errorMessage && <p className="hospital-reservation-error">{errorMessage}</p>}

          <div className="hospital-reservation-actions">
            <button type="button" className="ghost-btn" disabled={submitting} onClick={() => navigate("/hospital")}>
              취소
            </button>
            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? "접수 중..." : "예약 완료"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default HospitalReservationComponent;
