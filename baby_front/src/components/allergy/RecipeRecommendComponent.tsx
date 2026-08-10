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
    <div className="space-y-4">
      <p className="font-semibold text-gray-900">알레르기 회피 레시피 추천</p>

      <div className="flex gap-2">
        <select
          value={productType}
          onChange={(e) => setProductType(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2"
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
          className="rounded bg-sky-500 px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? "추천 받는 중..." : "레시피 추천받기"}
        </button>
      </div>

      {recipe && (
        <div className="whitespace-pre-line rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
          {recipe.recommendRecipe}
        </div>
      )}
    </div>
  );
};

export default RecipeRecommendComponent;
