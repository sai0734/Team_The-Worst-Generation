import { useEffect, useState } from "react";
import * as allergyApi from "../../api/allergyApi";
import type { AllergyIngredient } from "../../types/allergy";

const INGREDIENT_EMOJI: Record<string, string> = {
  "난류(가금류)": "🥚",
  "알류(가금류)": "🥚",
  우유: "🥛",
  메밀: "🌾",
  땅콩: "🥜",
  대두: "🌱",
  밀: "🌾",
  고등어: "🐟",
  게: "🦀",
  새우: "🦐",
  돼지고기: "🐖",
  복숭아: "🍑",
  토마토: "🍅",
  아황산류: "🧪",
  호두: "🌰",
  잣: "🌲",
  오징어: "🦑",
  "조개류(굴, 전복, 홍합 포함)": "🐚",
  쇠고기: "🥩",
  닭고기: "🍗",
};

const getIngredientEmoji = (name: string): string =>
  INGREDIENT_EMOJI[name] ?? "🍽️";

const AllergyIngredientListComponent = () => {
  const [ingredients, setIngredients] = useState<AllergyIngredient[]>([]);

  useEffect(() => {
    allergyApi.getAllIngredients().then(setIngredients);
  }, []);

  return (
    <div className="space-y-2">
      <p className="font-semibold text-gray-900">주요 알레르기 유발 성분</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {ingredients.map((ingredient) => (
          <div
            key={ingredient.ingredientNo}
            className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700"
          >
            <span>{getIngredientEmoji(ingredient.ingredientName)}</span>
            <span>{ingredient.ingredientName}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllergyIngredientListComponent;
