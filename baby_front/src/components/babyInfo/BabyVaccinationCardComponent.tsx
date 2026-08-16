import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import * as babyVaccinationApi from "../../api/babyVaccinationApi";
import {
  BabyVaccination,
  VaccinationProgress,
} from "../../api/babyVaccinationApi";

const getTodayStr = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

interface BabyVaccinationCardProps {
  babyNo: number;
  birthDate: string;
}

const labelClass = "text-[11px] font-bold tracking-wide text-[#7A756C]";
const inputClass =
  "w-full rounded-[14px] border border-[rgba(42,41,38,0.12)] bg-white px-4 py-2.5 text-sm text-[#2A2926] outline-none transition-colors focus:border-[#5AB2FF]";

const DDayBadge = ({ dDay }: { dDay: number }) => (
  <span
    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
      dDay >= 0
        ? "bg-[#EFE9DE] text-[#7A756C]"
        : "bg-[#f6dede] text-[#c0392b]"
    }`}
  >
    {dDay >= 0 ? `D-${dDay}` : `D+${Math.abs(dDay)}`}
  </span>
);

const BabyVaccinationCardComponent = ({
  babyNo,
  birthDate,
}: BabyVaccinationCardProps) => {
  const [list, setList] = useState<BabyVaccination[]>([]);
  const [customName, setCustomName] = useState("");
  const [progress, setProgress] = useState<VaccinationProgress | null>(null);
  const [editingNo, setEditingNo] = useState<number | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editHospital, setEditHospital] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [customDate, setCustomDate] = useState(getTodayStr());
  const [listFilter, setListFilter] = useState<
    "all" | "completed" | "pending" | null
  >("all");

  const loadList = async () => {
    const result: BabyVaccination[] = await babyVaccinationApi.getList(babyNo);
    setList(result);
  };

  const loadProgress = async () => {
    const result: VaccinationProgress =
      await babyVaccinationApi.getProgress(babyNo);
    setProgress(result);
  };

  useEffect(() => {
    const load = async () => {
      const result: BabyVaccination[] =
        await babyVaccinationApi.getList(babyNo);

      if (result.length === 0) {
        await babyVaccinationApi.init(babyNo);
      }

      await loadList();
      await loadProgress();
    };
    load();
  }, [babyNo]);

  const getMonthsBetween = (fromDate: string, toDate: string) => {
    const from = new Date(fromDate);
    const to = new Date(toDate);

    let months =
      (to.getFullYear() - from.getFullYear()) * 12 +
      (to.getMonth() - from.getMonth());

    if (to.getDate() < from.getDate()) {
      months -= 1;
    }

    return months;
  };

  const getDDay = (recommendedMonth: number) => {
    const target = new Date(birthDate);
    target.setMonth(target.getMonth() + recommendedMonth);
    target.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffMs = target.getTime() - today.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  };

  const handleToggleComplete = async (item: BabyVaccination) => {
    if (!item.vaccinationNo) return;

    const nextCompleted = !item.completed;

    if (!nextCompleted) {
      try {
        await babyVaccinationApi.completeCheck(item.vaccinationNo, {
          completed: false,
          completedDate: undefined,
          hospitalName: item.hospitalName,
        });
        await loadList();
        await loadProgress();
      } catch (err) {
        alert("접종 상태 변경에 실패했습니다.");
        console.error(err);
      }
      return;
    }

    handleOpenEdit(item);
  };

  const handleOpenEdit = (item: BabyVaccination) => {
    if (!item.vaccinationNo) return;
    setEditingNo(item.vaccinationNo);
    setEditDate(item.completedDate ?? getTodayStr());
    setEditHospital(item.hospitalName ?? "");
  };

  const handleSaveComplete = async (item: BabyVaccination) => {
    if (!item.vaccinationNo) return;

    try {
      await babyVaccinationApi.completeCheck(item.vaccinationNo, {
        completed: true,
        completedDate: editDate,
        hospitalName: editHospital,
      });

      setEditingNo(null);
      await loadList();
      await loadProgress();
    } catch (err) {
      alert("접종 완료 저장에 실패했습니다.");
      console.error(err);
    }
  };

  const handleCancelEdit = () => {
    setEditingNo(null);
  };

  const handleAddCustom = async () => {
    if (!customName) return;

    const recommendedMonth = getMonthsBetween(birthDate, customDate);

    try {
      await babyVaccinationApi.registerCustom({
        babyNo,
        vaccineName: customName,
        recommendedMonth,
        completed: false,
      });

      setCustomName("");
      setCustomDate(getTodayStr());
      setShowAddForm(false);
      await loadList();
      await loadProgress();
    } catch (err) {
      alert("접종 추가에 실패했습니다.");
      console.error(err);
    }
  };

  const handleRemove = async (vaccinationNo?: number) => {
    if (!vaccinationNo) return;
    if (!window.confirm("이 항목을 삭제하시겠습니까?")) return;

    try {
      await babyVaccinationApi.remove(vaccinationNo);
      await loadList();
      await loadProgress();
    } catch (err) {
      alert("표준 접종 항목은 삭제할 수 없습니다.");
      console.error(err);
    }
  };

  const completedCount = list.filter((item) => item.completed).length;
  const pendingCount = list.length - completedCount;

  const filteredList =
    listFilter === "completed"
      ? list.filter((item) => item.completed)
      : listFilter === "pending"
        ? list.filter((item) => !item.completed)
        : list;

  return (
    <div className="flex flex-col gap-4 rounded-[24px] border border-[rgba(42,41,38,0.1)] bg-[#FAF6F0] p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold tracking-[3px] text-[#5AB2FF]">
            VACCINATION
          </p>
          <h2 className="mt-1 text-[20px] font-bold text-[#2A2926]">
            예방접종
          </h2>
        </div>
        {!showAddForm && (
          <button
            className="rounded-full bg-[#5AB2FF] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1E6FCC]"
            type="button"
            onClick={() => setShowAddForm(true)}
          >
            + 예방접종 추가
          </button>
        )}
      </div>

      {progress && (
        <div className="flex flex-col items-center gap-3 rounded-[20px] border border-[rgba(42,41,38,0.1)] bg-white p-4 sm:flex-row sm:items-center">
          <div className="relative h-[110px] w-[110px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "완료", value: progress.completedCount },
                    {
                      name: "남음",
                      value: Math.max(
                        progress.totalCount - progress.completedCount,
                        0,
                      ),
                    },
                  ]}
                  dataKey="value"
                  innerRadius="72%"
                  outerRadius="100%"
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                  isAnimationActive
                >
                  <Cell fill="#5AB2FF" />
                  <Cell fill="#EFE9DE" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-bold text-[#2A2926]">
                {progress.completedCount}/{progress.totalCount}
              </span>
              {typeof progress.dDay === "number" &&
                !Number.isNaN(progress.dDay) && (
                  <span className="mt-0.5 text-xs font-bold text-[#5AB2FF]">
                    {progress.dDay >= 0
                      ? `D-${progress.dDay}`
                      : `D+${Math.abs(progress.dDay)}`}
                  </span>
                )}
            </div>
          </div>
          <div className="flex flex-1 min-w-0 flex-col items-center gap-2 sm:items-start">
            {progress.nextVaccineName && (
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#CAF4FF] px-2.5 py-1 text-xs font-bold text-[#1E6FCC]">
                  다음 접종
                </span>
                <span className="text-sm font-bold text-[#2A2926]">
                  {progress.nextVaccineName}
                </span>
                {typeof progress.dDay === "number" &&
                  !Number.isNaN(progress.dDay) && (
                    <DDayBadge dDay={progress.dDay} />
                  )}
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className="rounded-full bg-[#EFE9DE] px-3 py-1.5 text-xs font-bold text-[#7A756C]">
                완료율{" "}
                {progress.totalCount > 0
                  ? Math.round(
                      (progress.completedCount / progress.totalCount) * 100,
                    )
                  : 0}
                %
              </span>
              <span className="rounded-full bg-[#EFE9DE] px-3 py-1.5 text-xs font-bold text-[#7A756C]">
                남은 접종 {progress.totalCount - progress.completedCount}건
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: "all", label: `전체 (${list.length})` },
            { key: "completed", label: `접종 완료 (${completedCount})` },
            { key: "pending", label: `미접종 (${pendingCount})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
              listFilter === tab.key
                ? "bg-[#5AB2FF] text-white"
                : "border border-[rgba(42,41,38,0.15)] bg-white text-[#2A2926]"
            }`}
            type="button"
            onClick={() =>
              setListFilter((prev) => (prev === tab.key ? null : tab.key))
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {listFilter !== null && (
        <div className="flex flex-col gap-2">
          {filteredList.map((item) => (
          <div
            key={item.vaccinationNo}
            className="flex flex-col gap-2 rounded-[16px] border border-[rgba(42,41,38,0.1)] bg-white p-3"
          >
            <div className="flex items-center gap-2">
              <input
                className="h-4 w-4 accent-[#5AB2FF]"
                type="checkbox"
                checked={item.completed}
                onChange={() => handleToggleComplete(item)}
              />
              <span className="flex-1 min-w-0 text-sm font-bold text-[#2A2926]">
                {item.vaccineName}
              </span>
              {item.isCustom && (
                <span className="rounded-full bg-[#CAF4FF] px-2.5 py-1 text-xs font-bold text-[#1E6FCC]">
                  직접 추가
                </span>
              )}
              {!item.completed &&
                item.recommendedMonth != null &&
                (() => {
                  const dDay = getDDay(item.recommendedMonth);
                  return <DDayBadge dDay={dDay} />;
                })()}
              {item.completed && (
                <button
                  className="text-xs font-bold text-[#5AB2FF]"
                  type="button"
                  onClick={() => handleOpenEdit(item)}
                >
                  수정
                </button>
              )}
              {item.isCustom && (
                <button
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(42,41,38,0.06)] text-xs font-bold text-[#7A756C] transition-colors hover:bg-[#f3d9d9] hover:text-[#c0392b]"
                  type="button"
                  onClick={() => handleRemove(item.vaccinationNo)}
                >
                  ✕
                </button>
              )}
            </div>

            {item.completed && (
              <span className="pl-6 text-xs text-[#7A756C]">
                {item.completedDate} · {item.hospitalName || "병원명 미입력"}
              </span>
            )}

            {editingNo === item.vaccinationNo && (
              <div className="flex flex-col gap-2 border-t border-[rgba(42,41,38,0.1)] pt-2 sm:flex-row sm:items-end">
                <div className="flex-1 min-w-0">
                  <p className={labelClass}>접종일</p>
                  <input
                    className={inputClass}
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={labelClass}>병원명</p>
                  <input
                    className={inputClass}
                    type="text"
                    value={editHospital}
                    onChange={(e) => setEditHospital(e.target.value)}
                    placeholder="병원명"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    className="rounded-full bg-[#5AB2FF] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1E6FCC]"
                    type="button"
                    onClick={() => handleSaveComplete(item)}
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

      {showAddForm && (
        <div className="flex flex-col gap-2 rounded-[20px] border border-[rgba(42,41,38,0.1)] bg-white p-4 sm:flex-row sm:items-end">
          <div className="flex-1 min-w-0">
            <p className={labelClass}>예약 날짜</p>
            <input
              className={inputClass}
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className={labelClass}>접종명</p>
            <input
              className={inputClass}
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="직접 추가할 접종명"
            />
          </div>
          <div className="flex gap-2">
            <button
              className="flex-shrink-0 rounded-full bg-[#5AB2FF] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1E6FCC]"
              type="button"
              onClick={handleAddCustom}
            >
              추가
            </button>
            <button
              className="flex-shrink-0 rounded-full border border-[rgba(42,41,38,0.15)] px-5 py-2.5 text-sm font-bold text-[#7A756C]"
              type="button"
              onClick={() => setShowAddForm(false)}
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BabyVaccinationCardComponent;
