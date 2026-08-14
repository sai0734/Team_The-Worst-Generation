import jwtAxios from "../util/jwtUtil";
import type {
  AllergyIngredient,
  BabyAllergyCheck,
  BabyCustomAllergy,
  RecipeRecommend,
} from "../types/allergy";

const API_SERVER_HOST = "http://localhost:8080";
const host = `${API_SERVER_HOST}/api/allergy`;

export const checkAllergy = async (
  babyNo: number,
  image: File,
): Promise<BabyAllergyCheck> => {
  const formData = new FormData();
  formData.append("babyNo", String(babyNo));
  formData.append("image", image);

  const header = { headers: { "Content-Type": "multipart/form-data" } };

  const res = await jwtAxios.post(`${host}/check`, formData, header);

  return res.data;
};

export const getCustomAllergies = async (
  babyNo: number,
): Promise<BabyCustomAllergy[]> => {
  const res = await jwtAxios.get(`${host}/custom`, { params: { babyNo } });

  return res.data;
};

export const addCustomAllergy = async (
  babyNo: number,
  ingredientName: string,
): Promise<void> => {
  await jwtAxios.post(`${host}/custom`, null, {
    params: { babyNo, ingredientName },
  });
};

export const removeCustomAllergy = async (
  customAllergyNo: number,
): Promise<void> => {
  await jwtAxios.delete(`${host}/custom/${customAllergyNo}`);
};

export const updateCustomAllergy = async (
  customAllergyNo: number,
  ingredientName: string,
): Promise<void> => {
  await jwtAxios.put(`${host}/custom/${customAllergyNo}`, null, {
    params: { ingredientName },
  });
};

export const getAllIngredients = async (): Promise<AllergyIngredient[]> => {
  const res = await jwtAxios.get(`${host}/ingredient`);

  return res.data;
};

export const recommendRecipe = async (
  checkNo: number,
  productType: string,
): Promise<RecipeRecommend> => {
  const res = await jwtAxios.post(`${host}/recipe`, null, {
    params: { checkNo, productType },
  });

  return res.data;
};
