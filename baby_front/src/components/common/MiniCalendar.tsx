import { useState } from "react";

interface MiniCalendarProps {
  value: string; // "YYYY-MM-DD" 또는 빈 문자열
  onChange: (date: string) => void;
  isDateDisabled?: (date: string) => boolean;
}

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

const pad2 = (n: number) => String(n).padStart(2, "0");
const toDateStr = (y: number, m: number, d: number) => `${y}-${pad2(m)}-${pad2(d)}`;
const todayStr = () => {
  const t = new Date();
  return toDateStr(t.getFullYear(), t.getMonth() + 1, t.getDate());
};

const MiniCalendar = ({ value, onChange, isDateDisabled }: MiniCalendarProps) => {
  const initial = value ? new Date(`${value}T00:00:00`) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth() + 1); // 1~12

  const today = todayStr();

  const firstWeekday = new Date(viewYear, viewMonth - 1, 1).getDay(); // 0=일
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const moveMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setViewYear(y);
    setViewMonth(m);
  };

  return (
    <div className="mini-calendar">
      <div className="mini-calendar-header">
        <button type="button" className="icon-btn-ghost" onClick={() => moveMonth(-1)} aria-label="이전 달">
          ‹
        </button>
        <span>
          {viewYear}년 {viewMonth}월
        </span>
        <button type="button" className="icon-btn-ghost" onClick={() => moveMonth(1)} aria-label="다음 달">
          ›
        </button>
      </div>

      <div className="mini-calendar-grid mini-calendar-weekdays">
        {WEEKDAY_LABELS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className="mini-calendar-grid">
        {cells.map((day, idx) => {
          if (day === null) {
            return <span key={`empty-${idx}`} />;
          }

          const dateStr = toDateStr(viewYear, viewMonth, day);
          const isPast = dateStr < today;
          const disabled = isPast || (isDateDisabled?.(dateStr) ?? false);
          const selected = dateStr === value;

          return (
            <button
              type="button"
              key={dateStr}
              className={`mini-calendar-day${disabled ? " disabled" : ""}${selected ? " selected" : ""}${dateStr === today ? " today" : ""}`}
              disabled={disabled}
              onClick={() => onChange(dateStr)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendar;
