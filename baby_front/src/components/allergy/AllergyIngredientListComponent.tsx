import { useEffect, useState } from "react";
import * as allergyApi from "../../api/allergyApi";
import type { AllergyIngredient } from "../../types/allergy";

const AllergyIngredientListComponent = () => {
  const [ingredients, setIngredients] = useState<AllergyIngredient[]>([]);

  useEffect(() => {
    allergyApi.getAllIngredients().then(setIngredients);
  }, []);

  return (
    <div className="space-y-2">
      <p className="font-semibold text-gray-900">주요 알레르기 유발 성분</p>
      <div className="flex flex-wrap gap-2">
        {ingredients.map((ingredient) => (
          <span
            key={ingredient.ingredientNo}
            className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
          >
            {ingredient.ingredientName}
          </span>
        ))}
      </div>
    </div>
  );
};

export default AllergyIngredientListComponent;
