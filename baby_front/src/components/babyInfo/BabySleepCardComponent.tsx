import { useEffect, useState } from "react";
import * as babySleepApi from "../../api/babySleepApi";
import { BabySleep } from "../../api/babySleepApi";

interface BabySleepCardProps {
  babyNo: number;
}

const BabySleepCardComponent = ({ babyNo }: BabySleepCardProps) => {
  const [list, setList] = useState<BabySleep[]>([]);
  const [sleepType, setSleepType] = useState("낮잠");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [editingNo, setEditingNo] = useState<number | null>(null);
  const [editSleepType, setEditSleepType] = useState("낮잠");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");

  const loadList = async () => {
    const result: BabySleep[] = await babySleepApi.getList(babyNo);
    setList(result);
  };

  useEffect(() => {
    loadList();
  }, [babyNo]);

  const handleRegister = async () => {
    if (!startTime) return;

    await babySleepApi.register({
      babyNo,
      sleepType,
      startTime,
      endTime: endTime || undefined,
    });

    setStartTime("");
    setEndTime("");
    await loadList();
  };

  const handleRemove = async (sleepNo?: number) => {
    if (!sleepNo) return;
    if (!window.confirm("이 기록을 삭제하시겠습니까?")) return;

    try {
      await babySleepApi.remove(sleepNo);
      await loadList();
    } catch (err) {
      alert("삭제에 실패했습니다.");
      console.error(err);
    }
  };

  const handleOpenEdit = (item: BabySleep) => {
    if (!item.sleepNo) return;
    setEditingNo(item.sleepNo);
    setEditSleepType(item.sleepType);
    setEditStartTime(item.startTime);
    setEditEndTime(item.endTime ?? "");
  };

  const handleSaveEdit = async (item: BabySleep) => {
    if (!item.sleepNo) return;

    await babySleepApi.modify(item.sleepNo, {
      sleepType: editSleepType,
      startTime: editStartTime,
      endTime: editEndTime || undefined,
    });

    setEditingNo(null);
    await loadList();
  };

  const handleCancelEdit = () => {
    setEditingNo(null);
  };

  const toDateStr = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getTodaySegments = () => {
    const todayStr = toDateStr(new Date());

    return list
      .filter((item) => item.startTime.slice(0, 10) === todayStr)
      .map((item) => {
        const start = new Date(item.startTime);
        const end = item.endTime ? new Date(item.endTime) : new Date();

        const startMinutes = start.getHours() * 60 + start.getMinutes();
        const endMinutes = end.getHours() * 60 + end.getMinutes();

        const left = (startMinutes / (24 * 60)) * 100;
        const width = ((endMinutes - startMinutes) / (24 * 60)) * 100;

        return {
          sleepNo: item.sleepNo,
          sleepType: item.sleepType,
          left,
          width,
        };
      });
  };

  const getWeekSummary = () => {
    const days: { dateStr: string; nap: number; night: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({ dateStr: toDateStr(d), nap: 0, night: 0 });
    }

    list.forEach((item) => {
      const dateStr = item.startTime.slice(0, 10);
      const day = days.find((d) => d.dateStr === dateStr);
      if (!day) return;

      const start = new Date(item.startTime);
      const end = item.endTime ? new Date(item.endTime) : new Date();
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      if (item.sleepType === "낮잠") {
        day.nap += hours;
      } else {
        day.night += hours;
      }
    });

    return days;
  };

  const getDuration = (item: BabySleep) => {
    if (!item.endTime) return "-";

    const start = new Date(item.startTime);
    const end = new Date(item.endTime);
    const totalMinutes = Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60),
    );

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) return `${minutes}분`;
    if (minutes === 0) return `${hours}시간`;
    return `${hours}시간 ${minutes}분`;
  };

  return (
    <div>
      <p>수면 기록</p>

      <div style={{ position: "relative", height: 24, background: "#eee" }}>
        {getTodaySegments().map((seg) => (
          <div
            key={seg.sleepNo}
            style={{
              position: "absolute",
              left: `${seg.left}%`,
              width: `${seg.width}%`,
              height: "100%",
              background: seg.sleepType === "낮잠" ? "#F5B450" : "#7A9FE0",
            }}
          />
        ))}
      </div>

      <div
        style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}
      >
        {getWeekSummary().map((day) => {
          const total = day.nap + day.night;
          const maxHours = Math.max(
            ...getWeekSummary().map((d) => d.nap + d.night),
            1,
          );
          const barHeightPercent = (total / maxHours) * 100;
          const nightPercent = total > 0 ? (day.night / total) * 100 : 0;
          const napPercent = total > 0 ? (day.nap / total) * 100 : 0;

          return (
            <div
              key={day.dateStr}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: 30,
                height: 100,
                justifyContent: "flex-end",
              }}
            >
              <div
                style={{
                  width: 20,
                  height: `${barHeightPercent}%`,
                  display: "flex",
                  flexDirection: "column-reverse",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: `${nightPercent}%`,
                    background: "#7A9FE0",
                  }}
                />
                <div
                  style={{
                    width: "100%",
                    height: `${napPercent}%`,
                    background: "#F5B450",
                  }}
                />
              </div>
              <span>{day.dateStr.slice(5)}</span>
            </div>
          );
        })}
      </div>

      {list.map((item) => (
        <div key={item.sleepNo}>
          <span>{item.sleepType}</span>
          <span>
            {item.startTime} ~ {item.endTime ?? "진행중"}
          </span>
          <span>{getDuration(item)}</span>
          <button type="button" onClick={() => handleOpenEdit(item)}>
            수정
          </button>
          <button type="button" onClick={() => handleRemove(item.sleepNo)}>
            X
          </button>
          {editingNo === item.sleepNo && (
            <div>
              <select
                value={editSleepType}
                onChange={(e) => setEditSleepType(e.target.value)}
              >
                <option value="낮잠">낮잠</option>
                <option value="밤잠">밤잠</option>
              </select>
              <input
                type="datetime-local"
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
              />
              <input
                type="datetime-local"
                value={editEndTime}
                onChange={(e) => setEditEndTime(e.target.value)}
              />
              <button type="button" onClick={() => handleSaveEdit(item)}>
                저장
              </button>
              <button type="button" onClick={handleCancelEdit}>
                취소
              </button>
            </div>
          )}
        </div>
      ))}

      <select value={sleepType} onChange={(e) => setSleepType(e.target.value)}>
        <option value="낮잠">낮잠</option>
        <option value="밤잠">밤잠</option>
      </select>
      <input
        type="datetime-local"
        value={startTime}
        onChange={(e) => setStartTime(e.target.value)}
      />
      <input
        type="datetime-local"
        value={endTime}
        onChange={(e) => setEndTime(e.target.value)}
      />
      <button type="button" onClick={handleRegister}>
        기록 추가
      </button>
    </div>
  );
};

export default BabySleepCardComponent;
