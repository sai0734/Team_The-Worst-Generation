import { useEffect, useState } from "react";
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
      await babyVaccinationApi.completeCheck(item.vaccinationNo, {
        completed: false,
        completedDate: undefined,
        hospitalName: item.hospitalName,
      });
      await loadList();
      await loadProgress();
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

    await babyVaccinationApi.completeCheck(item.vaccinationNo, {
      completed: true,
      completedDate: editDate,
      hospitalName: editHospital,
    });

    setEditingNo(null);
    await loadList();
    await loadProgress();
  };

  const handleCancelEdit = () => {
    setEditingNo(null);
  };

  const handleAddCustom = async () => {
    if (!customName) return;

    await babyVaccinationApi.registerCustom({
      babyNo,
      vaccineName: customName,
      completed: false,
    });

    setCustomName("");
    await loadList();
    await loadProgress();
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

  const percent =
    progress && progress.totalCount > 0
      ? (progress.completedCount / progress.totalCount) * 100
      : 0;

  return (
    <div>
      <p>예방접종</p>
      {progress && (
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: `conic-gradient(#4caf50 0% ${percent}%, #e0e0e0 ${percent}% 100%)`,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "10%",
              left: "10%",
              width: "80%",
              height: "80%",
              borderRadius: "50%",
              background: "white",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span>
              {progress.completedCount}/{progress.totalCount}
            </span>
            {progress.dDay !== null && (
              <span>
                {progress.dDay >= 0
                  ? `D-${progress.dDay}`
                  : `D+${Math.abs(progress.dDay)}`}
              </span>
            )}
          </div>
        </div>
      )}
      {progress?.nextVaccineName && (
        <p>다음 접종: {progress.nextVaccineName}</p>
      )}
      {list.map((item) => (
        <div key={item.vaccinationNo}>
          <input
            type="checkbox"
            checked={item.completed}
            onChange={() => handleToggleComplete(item)}
          />
          <span>{item.vaccineName}</span>
          {item.isCustom && <span>직접 추가</span>}
          {item.completed && (
            <span>
              {item.completedDate} · {item.hospitalName || "병원명 미입력"}
            </span>
          )}
          {!item.completed &&
            item.recommendedMonth != null &&
            (() => {
              const dDay = getDDay(item.recommendedMonth);
              return (
                <span>{dDay >= 0 ? `D-${dDay}` : `D+${Math.abs(dDay)}`}</span>
              );
            })()}
          {item.completed && (
            <button type="button" onClick={() => handleOpenEdit(item)}>
              수정
            </button>
          )}
          {item.isCustom && (
            <button
              type="button"
              onClick={() => handleRemove(item.vaccinationNo)}
            >
              X
            </button>
          )}
          {editingNo === item.vaccinationNo && (
            <div>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
              <input
                type="text"
                value={editHospital}
                onChange={(e) => setEditHospital(e.target.value)}
                placeholder="병원명"
              />
              <button type="button" onClick={() => handleSaveComplete(item)}>
                저장
              </button>
              <button type="button" onClick={handleCancelEdit}>
                취소
              </button>
            </div>
          )}
        </div>
      ))}

      <input
        value={customName}
        onChange={(e) => setCustomName(e.target.value)}
        placeholder="직접 추가할 접종명"
      />
      <button type="button" onClick={handleAddCustom}>
        추가
      </button>
    </div>
  );
};

export default BabyVaccinationCardComponent;
