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
    <div className="space-y-4">
      <p className="font-semibold text-gray-900">추가 알레르기 성분 관리</p>

      {loadError && <p className="text-sm text-red-500">{loadError}</p>}

      <div className="flex gap-2">
        <input
          type="text"
          value={ingredientName}
          onChange={(e) => setIngredientName(e.target.value)}
          placeholder="성분명 입력"
          className="flex-1 rounded border border-gray-300 px-3 py-2"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="rounded bg-sky-500 px-4 py-2 text-white"
        >
          추가
        </button>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-gray-500">
          등록된 추가 알레르기 성분이 없습니다.
        </p>
      ) : (
        <ul className="space-y-2">
          {list.map((item) => (
            <li
              key={item.customAllergyNo}
              className="flex items-center justify-between rounded border border-gray-200 px-3 py-2"
            >
              {editingNo === item.customAllergyNo ? (
                <>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="mr-2 flex-1 rounded border border-gray-300 px-2 py-1"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdate(item.customAllergyNo)}
                      className="text-sm text-sky-500"
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="text-sm text-gray-500"
                    >
                      취소
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span>{item.ingredientName}</span>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="text-sm text-sky-500"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.customAllergyNo)}
                      className="text-sm text-red-500"
                    >
                      삭제
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomAllergyListComponent;
