import { useState } from "react";
import * as allergyApi from "../../api/allergyApi";
import type { RecipeRecommend } from "../../types/allergy";

interface RecipeRecommendComponentProps {
  checkNo: number;
}

const productTypes = ["이유식", "간식", "국"];

const RecipeRecommendComponent = ({
  checkNo,
}: RecipeRecommendComponentProps) => {
  const [productType, setProductType] = useState(productTypes[0]);
  const [recipe, setRecipe] = useState<RecipeRecommend | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRecommend = async () => {
    setLoading(true);
    try {
      const result = await allergyApi.recommendRecipe(checkNo, productType);
      setRecipe(result);
    } catch (err) {
      alert("레시피 추천에 실패했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="head">
        <h2>알레르기 회피 레시피 추천</h2>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <select
          value={productType}
          onChange={(e) => setProductType(e.target.value)}
          style={{
            padding: "10px 12px",
            border: "1px solid var(--line)",
            borderRadius: 12,
            background: "var(--glass)",
          }}
        >
          {productTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={loading}
          onClick={handleRecommend}
          className="submit-btn"
        >
          {loading ? "추천 받는 중..." : "레시피 추천받기"}
        </button>
      </div>

      {recipe && (
        <p style={{ whiteSpace: "pre-line", marginTop: 16 }}>
          {recipe.recommendRecipe}
        </p>
      )}
    </div>
  );
};

export default RecipeRecommendComponent;
