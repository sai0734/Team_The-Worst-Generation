import jwtAxios from "../util/jwtUtil";

const API_SERVER_HOST = "http://localhost:8080";
const prefix = `${API_SERVER_HOST}/api/recall/my-products`;

export type RecallMatchType = "CERT" | "DOMESTIC" | "FOREIGN";

// MyProductDTO
export interface MyProduct {
  productNo?: number;
  memberEmail?: string;
  productName: string;
  brandName?: string;
  modelName?: string;
  certNum?: string;
  recallMatched?: boolean;
  recallType?: RecallMatchType;
  recallUid?: string;
  recallTitle?: string;
  checkedTime?: string;
  regTime?: string;
}

export const registerMyProduct = async (
  product: MyProduct,
): Promise<MyProduct> => {
  const res = await jwtAxios.post(prefix, product);
  return res.data;
};

export const getMyProductList = async (): Promise<MyProduct[]> => {
  const res = await jwtAxios.get(prefix);
  return res.data;
};

export const removeMyProduct = async (productNo: number): Promise<void> => {
  await jwtAxios.delete(`${prefix}/${productNo}`);
};

// RecallOcrResultDTO
export interface RecallOcrResult {
  productName?: string;
  brandName?: string;
  modelName?: string;
  certNum?: string;
  rawText?: string;
}

export const extractFromImage = async (
  image: File,
): Promise<RecallOcrResult> => {
  const formData = new FormData();
  formData.append("image", image);

  const res = await jwtAxios.post(`${prefix}/ocr`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};
