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
    <div className="flex flex-col gap-4 rounded-[24px] border border-[rgba(42,41,38,0.1)] bg-[#FAF6F0] p-4 sm:p-6">
      <div>
        <p className="text-sm font-bold text-[#2A2926]">
          주요 알레르기 유발 성분
        </p>
        <p className="mt-1 text-xs text-[#7A756C]">
          식약처가 표시를 의무화한 22가지 알레르기 유발 성분이에요. 이유식이나
          간식을 고를 때 참고해보세요.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {ingredients.map((ingredient) => (
          <div
            key={ingredient.ingredientNo}
            className="flex items-center gap-2.5 rounded-[16px] border border-[rgba(42,41,38,0.1)] bg-white px-3.5 py-3 text-sm font-bold text-[#2A2926] shadow-sm"
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#EAF6FF] text-base">
              {getIngredientEmoji(ingredient.ingredientName)}
            </span>
            <span className="min-w-0 truncate">{ingredient.ingredientName}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllergyIngredientListComponent;
