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
    <div className="card">
      <div className="head">
        <h2>추가 알레르기 성분 관리</h2>
      </div>

      {loadError && (
        <p style={{ color: "#ef6262", fontSize: 13, marginBottom: 10 }}>
          {loadError}
        </p>
      )}

      <div
        className="field"
        style={{ display: "flex", gap: 8, alignItems: "flex-end" }}
      >
        <div style={{ flex: 1 }}>
          <label>성분명</label>
          <input
            type="text"
            value={ingredientName}
            onChange={(e) => setIngredientName(e.target.value)}
            placeholder="성분명 입력"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="submit-btn"
          style={{ padding: "0 20px" }}
        >
          추가
        </button>
      </div>

      {list.length === 0 ? (
        <p className="empty-hint">등록된 추가 알레르기 성분이 없습니다.</p>
      ) : (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            marginTop: 14,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {list.map((item) => (
            <li
              key={item.customAllergyNo}
              className="card"
              style={{
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              {editingNo === item.customAllergyNo ? (
                <>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    style={{
                      flex: 1,
                      marginRight: 10,
                      padding: "8px 10px",
                      border: "1px solid var(--line)",
                      borderRadius: 10,
                    }}
                  />
                  <div style={{ display: "flex", gap: 10 }}>
                    <span
                      style={{
                        cursor: "pointer",
                        color: "var(--accent)",
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                      onClick={() => handleUpdate(item.customAllergyNo)}
                    >
                      저장
                    </span>
                    <span
                      style={{
                        cursor: "pointer",
                        color: "var(--muted)",
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                      onClick={cancelEdit}
                    >
                      취소
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <span>{item.ingredientName}</span>
                  <div style={{ display: "flex", gap: 14 }}>
                    <span
                      style={{
                        cursor: "pointer",
                        color: "var(--accent)",
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                      onClick={() => startEdit(item)}
                    >
                      수정
                    </span>
                    <span
                      style={{
                        cursor: "pointer",
                        color: "#ef6262",
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                      onClick={() => handleRemove(item.customAllergyNo)}
                    >
                      삭제
                    </span>
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
