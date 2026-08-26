import { useCallback, useEffect, useState } from "react";
import * as allergyApi from "../../api/allergyApi";
import type { BabyCustomAllergy } from "../../types/allergy";

interface CustomAllergyListComponentProps {
  babyNo: number;
}

const CustomAllergyListComponent = ({
  babyNo,
}: CustomAllergyListComponentProps) => {
  const [list, setList] = useState<BabyCustomAllergy[]>([]);
  const [ingredientName, setIngredientName] = useState("");
  const [editingNo, setEditingNo] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await allergyApi.getCustomAllergies(babyNo);
      setList(data);
      setLoadError(null);
    } catch (err) {
      setLoadError(
        "알레르기 정보를 불러오지 못했습니다. 로그인 상태를 확인해주세요.",
      );
      console.error(err);
    }
  }, [babyNo]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async () => {
    if (!ingredientName.trim()) return;

    try {
      await allergyApi.addCustomAllergy(babyNo, ingredientName.trim());
      setIngredientName("");
      await load();
    } catch (err) {
      alert("추가 알레르기 성분 등록에 실패했습니다.");
      console.error(err);
    }
  };

  const handleRemove = async (customAllergyNo?: number) => {
    if (!customAllergyNo) return;

    try {
      await allergyApi.removeCustomAllergy(customAllergyNo);
      await load();
    } catch (err) {
      alert("삭제에 실패했습니다.");
      console.error(err);
    }
  };

  const startEdit = (item: BabyCustomAllergy) => {
    setEditingNo(item.customAllergyNo ?? null);
    setEditingName(item.ingredientName);
  };

  const cancelEdit = () => {
    setEditingNo(null);
    setEditingName("");
  };

  const handleUpdate = async (customAllergyNo?: number) => {
    if (!customAllergyNo || !editingName.trim()) return;

    try {
      await allergyApi.updateCustomAllergy(customAllergyNo, editingName.trim());
      cancelEdit();
      await load();
    } catch (err) {
      alert("수정에 실패했습니다.");
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-[24px] border border-[rgba(42,41,38,0.1)] bg-[#FAF6F0] p-4 sm:p-6">
        <p className="text-sm font-bold text-[#2A2926]">
          추가 알레르기 성분 관리
        </p>
        <p className="text-xs text-[#7A756C]">
          공식 알레르기 유발 성분 목록에 없어도, 우리 아이가 특별히 조심해야
          하는 성분을 직접 등록해두면 성분표 검사할 때 같이 확인해드려요.
        </p>

        {loadError && <p className="text-sm text-[#C0392B]">{loadError}</p>}

        <div className="flex gap-2">
          <input
            type="text"
            value={ingredientName}
            onChange={(e) => setIngredientName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="성분명 입력 (예: 땅콩)"
            className="flex-1 rounded-full border border-[rgba(42,41,38,0.12)] bg-white px-4 py-2.5 text-sm text-[#2A2926] outline-none transition-colors focus:border-[#5AB2FF]"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="flex-shrink-0 rounded-full bg-[#005BB2] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#004A99]"
          >
            추가
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-[rgba(42,41,38,0.15)] bg-white p-8 text-center">
          <span className="text-2xl">🌿</span>
          <p className="text-sm font-bold text-[#2A2926]">
            등록된 추가 알레르기 성분이 없어요
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {list.map((item) => (
            <div
              key={item.customAllergyNo}
              className="flex items-center gap-2 rounded-full border border-[rgba(42,41,38,0.1)] bg-white py-2 pl-4 pr-2"
            >
              {editingNo === item.customAllergyNo ? (
                <>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleUpdate(item.customAllergyNo)
                    }
                    autoFocus
                    className="w-24 border-b border-[#5AB2FF] bg-transparent text-sm text-[#2A2926] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdate(item.customAllergyNo)}
                    className="rounded-full bg-[#5AB2FF] px-3 py-1 text-xs font-bold text-white"
                  >
                    저장
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-full bg-[rgba(42,41,38,0.06)] px-3 py-1 text-xs font-bold text-[#7A756C]"
                  >
                    취소
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm font-bold text-[#2A2926]">
                    {item.ingredientName}
                  </span>
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-xs text-[#7A756C] transition-colors hover:bg-[rgba(42,41,38,0.06)]"
                    aria-label="수정"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.customAllergyNo)}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-xs text-[#7A756C] transition-colors hover:bg-[#f3d9d9] hover:text-[#c0392b]"
                    aria-label="삭제"
                  >
                    ✕
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomAllergyListComponent;
