export interface BabyAllergyCheck {
  checkNo?: number;
  babyNo: number;
  imageFileName?: string;
  ocrRawText?: string;
  detectedAllergens?: string;
  detectedCustom?: string;
  regTime?: string;
}

export interface BabyCustomAllergy {
  customAllergyNo?: number;
  babyNo: number;
  ingredientName: string;
  regTime?: string;
}

export interface AllergyIngredient {
  ingredientNo: number;
  ingredientName: string;
}

export interface RecipeRecommend {
  recommendNo?: number;
  checkNo: number;
  productType: string;
  recommendRecipe?: string;
  mixingInstruction?: string;
  regTime?: string;
}
