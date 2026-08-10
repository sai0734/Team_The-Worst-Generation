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

  const load = useCallback(async () => {
    const data = await allergyApi.getCustomAllergies(babyNo);
    setList(data);
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

  return (
    <div className="space-y-4">
      <p className="font-semibold text-gray-900">추가 알레르기 성분 관리</p>

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
              <span>{item.ingredientName}</span>
              <button
                type="button"
                onClick={() => handleRemove(item.customAllergyNo)}
                className="text-sm text-red-500"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomAllergyListComponent;
