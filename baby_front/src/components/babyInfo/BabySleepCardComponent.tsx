import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import * as babySleepApi from "../../api/babySleepApi";
import { BabySleep } from "../../api/babySleepApi";

interface BabySleepCardProps {
  babyNo: number;
}

const NAP_COLOR = "#F5B478";
const NIGHT_COLOR = "#5AB2FF";
const AXIS_TICK = { fill: "#7A756C", fontSize: 12 };

const labelClass = "text-[11px] font-bold tracking-wide text-[#7A756C]";
const inputClass =
  "w-full rounded-[14px] border border-[rgba(42,41,38,0.12)] bg-white px-4 py-2.5 text-sm text-[#2A2926] outline-none transition-colors focus:border-[#5AB2FF]";
const selectClass = inputClass;

const BabySleepCardComponent = ({ babyNo }: BabySleepCardProps) => {
  const [list, setList] = useState<BabySleep[]>([]);
  const [sleepType, setSleepType] = useState("낮잠");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [editingNo, setEditingNo] = useState<number | null>(null);
  const [editSleepType, setEditSleepType] = useState("낮잠");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showList, setShowList] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);

  const loadList = async () => {
    const result: BabySleep[] = await babySleepApi.getList(babyNo);
    setList(result);
  };

  useEffect(() => {
    loadList();
  }, [babyNo]);

  const handleRegister = async () => {
    if (!startTime) return;

    try {
      await babySleepApi.register({
        babyNo,
        sleepType,
        startTime,
        endTime: endTime || undefined,
      });

      setStartTime("");
      setEndTime("");
      setShowForm(false);
      await loadList();
    } catch (err) {
      alert("기록 추가에 실패했습니다.");
      console.error(err);
    }
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

    try {
      await babySleepApi.modify(item.sleepNo, {
        sleepType: editSleepType,
        startTime: editStartTime,
        endTime: editEndTime || undefined,
      });

      setEditingNo(null);
      await loadList();
    } catch (err) {
      alert("수정에 실패했습니다.");
      console.error(err);
    }
  };

  const handleCancelEdit = () => {
    setEditingNo(null);
  };

  const handleGetAdvice = async () => {
    setAdviceLoading(true);
    try {
      const result = await babySleepApi.getAdvice(babyNo);
      setAdvice(result.advice);
    } catch (err) {
      alert("조언을 받아오는데 실패했습니다.");
      console.error(err);
    } finally {
      setAdviceLoading(false);
    }
  };

  const toDateStr = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${month}월 ${day}일 ${hours}:${minutes}`;
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

  const todaySegments = getTodaySegments();
  const weekSummary = getWeekSummary().map((day) => ({
    ...day,
    nap: Number(day.nap.toFixed(1)),
    night: Number(day.night.toFixed(1)),
  }));

  return (
    <div className="flex flex-col gap-4 rounded-[24px] border border-[rgba(42,41,38,0.1)] bg-[#FAF6F0] p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold tracking-[3px] text-[#5AB2FF]">
            SLEEP
          </p>
          <h2 className="mt-1 text-[20px] font-bold text-[#2A2926]">
            수면 기록
          </h2>
        </div>
        {!showForm && (
          <button
            className="rounded-full bg-[#5AB2FF] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1E6FCC]"
            type="button"
            onClick={() => setShowForm(true)}
          >
            + 기록 추가
          </button>
        )}
      </div>

      {list.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-[rgba(42,41,38,0.15)] bg-white p-8 text-center">
          <span className="text-2xl">🌙</span>
          <p className="text-sm font-bold text-[#2A2926]">
            아직 수면기록이 없어요
          </p>
          <p className="text-xs text-[#7A756C]">
            낮잠·밤잠을 기록하면 오늘의 타임라인과 최근 7일 패턴이 여기에
            표시됩니다
          </p>
        </div>
      )}

      {list.length > 0 && (
        <>
          <div className="flex items-center gap-3 text-xs font-bold text-[#7A756C]">
            <span className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: NAP_COLOR }}
              />
              낮잠
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: NIGHT_COLOR }}
              />
              밤잠
            </span>
          </div>

          <div className="rounded-[20px] border border-[rgba(42,41,38,0.1)] bg-white p-4">
            <p className={labelClass}>오늘</p>
            <div className="relative mt-2 h-[28px] overflow-hidden rounded-full bg-[#EFE9DE]">
              {todaySegments.map((seg) => (
                <div
                  key={seg.sleepNo}
                  className="absolute h-full"
                  style={{
                    left: `${seg.left}%`,
                    width: `${seg.width}%`,
                    background:
                      seg.sleepType === "낮잠" ? NAP_COLOR : NIGHT_COLOR,
                  }}
                />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-[#7A756C]">
              <span>0시</span>
              <span>6시</span>
              <span>12시</span>
              <span>18시</span>
              <span>24시</span>
            </div>
          </div>

          <div className="rounded-[20px] border border-[rgba(42,41,38,0.1)] bg-white p-4">
            <p className={labelClass}>최근 7일</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart
                data={weekSummary}
                margin={{ top: 12, right: 0, left: 0, bottom: 0 }}
              >
                <XAxis
                  dataKey="dateStr"
                  tickFormatter={(d: string) => d.slice(5)}
                  tick={AXIS_TICK}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={AXIS_TICK}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  formatter={(value) => `${value}시간`}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid rgba(42,41,38,0.1)",
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="nap"
                  name="낮잠"
                  stackId="sleep"
                  fill={NAP_COLOR}
                />
                <Bar
                  dataKey="night"
                  name="밤잠"
                  stackId="sleep"
                  fill={NIGHT_COLOR}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-[20px] border border-[rgba(42,41,38,0.1)] bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <p className={labelClass}>AI 수면 조언</p>
              <button
                type="button"
                className="flex-shrink-0 rounded-full bg-[#5AB2FF] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#1E6FCC] disabled:opacity-50"
                onClick={handleGetAdvice}
                disabled={adviceLoading}
              >
                {adviceLoading ? "분석 중..." : "조언 받기"}
              </button>
            </div>
            {adviceLoading && (
              <p className="mt-2 text-sm text-[#7A756C]">
                AI가 수면 패턴을 분석하고 있어요...
              </p>
            )}
            {!adviceLoading && advice && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-[#2A2926]">
                {advice}
              </p>
            )}
          </div>
        </>
      )}

      <button
        className="self-start rounded-full border border-[rgba(42,41,38,0.15)] bg-white px-4 py-2 text-xs font-bold text-[#2A2926]"
        type="button"
        onClick={() => setShowList((prev) => !prev)}
      >
        {showList ? "기록 목록 접기" : `전체 기록 목록 보기 (${list.length})`}
      </button>

      {showList && (
        <div className="flex flex-col gap-2">
          {list.map((item) => (
            <div
              key={item.sleepNo}
              className="flex flex-col gap-2 rounded-[16px] border border-[rgba(42,41,38,0.1)] bg-white p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-base"
                    style={{
                      background:
                        item.sleepType === "낮잠" ? "#FCEBD9" : "#DDEEFF",
                    }}
                  >
                    {item.sleepType === "낮잠" ? "☀️" : "🌙"}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#2A2926]">
                      {item.sleepType}
                    </span>
                    <span className="text-xs text-[#7A756C]">
                      {formatDateTime(item.startTime)} →{" "}
                      {item.endTime ? formatDateTime(item.endTime) : "진행중"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#EFE9DE] px-3 py-1 text-xs font-bold text-[#7A756C]">
                    {getDuration(item)}
                  </span>
                  <button
                    className="text-xs font-bold text-[#5AB2FF]"
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                  >
                    수정
                  </button>
                  <button
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(42,41,38,0.06)] text-xs font-bold text-[#7A756C] transition-colors hover:bg-[#f3d9d9] hover:text-[#c0392b]"
                    type="button"
                    onClick={() => handleRemove(item.sleepNo)}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {editingNo === item.sleepNo && (
                <div className="flex flex-col gap-2 border-t border-[rgba(42,41,38,0.1)] pt-2 sm:flex-row sm:items-end">
                  <div className="flex-1 min-w-0">
                    <p className={labelClass}>종류</p>
                    <select
                      className={selectClass}
                      value={editSleepType}
                      onChange={(e) => setEditSleepType(e.target.value)}
                    >
                      <option value="낮잠">낮잠</option>
                      <option value="밤잠">밤잠</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={labelClass}>시작</p>
                    <input
                      className={inputClass}
                      type="datetime-local"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={labelClass}>종료</p>
                    <input
                      className={inputClass}
                      type="datetime-local"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="rounded-full bg-[#5AB2FF] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1E6FCC]"
                      type="button"
                      onClick={() => handleSaveEdit(item)}
                    >
                      저장
                    </button>
                    <button
                      className="rounded-full border border-[rgba(42,41,38,0.15)] px-4 py-2.5 text-sm font-bold text-[#7A756C]"
                      type="button"
                      onClick={handleCancelEdit}
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="flex flex-col gap-2 rounded-[20px] border border-[rgba(42,41,38,0.1)] bg-white p-4 sm:flex-row sm:items-end">
          <div className="flex-1 min-w-0">
            <p className={labelClass}>종류</p>
            <select
              className={selectClass}
              value={sleepType}
              onChange={(e) => setSleepType(e.target.value)}
            >
              <option value="낮잠">낮잠</option>
              <option value="밤잠">밤잠</option>
            </select>
          </div>
          <div className="flex-1 min-w-0">
            <p className={labelClass}>시작</p>
            <input
              className={inputClass}
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className={labelClass}>종료</p>
            <input
              className={inputClass}
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button
              className="flex-shrink-0 rounded-full bg-[#5AB2FF] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1E6FCC]"
              type="button"
              onClick={handleRegister}
            >
              추가
            </button>
            <button
              className="flex-shrink-0 rounded-full border border-[rgba(42,41,38,0.15)] px-5 py-2.5 text-sm font-bold text-[#7A756C]"
              type="button"
              onClick={() => setShowForm(false)}
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BabySleepCardComponent;
