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
  imageName?: string;
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

export const updateMyProduct = async (
  productNo: number,
  product: MyProduct,
): Promise<MyProduct> => {
  const res = await jwtAxios.put(`${prefix}/${productNo}`, product);
  return res.data;
};

// RecallOcrResultDTO
export interface RecallOcrResult {
  productName?: string;
  brandName?: string;
  modelName?: string;
  certNum?: string;
  rawText?: string;
  imageName?: string;
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

export const getMyProductImageUrl = (imageName: string): string =>
  `${prefix}/view/${imageName}`;

export const getMyProductThumbnailUrl = (imageName: string): string =>
  `${prefix}/view/s_${imageName}`;

// ===== 리콜 상세정보 (SafetyKorea 원본 데이터) =====
const recallDetailPrefix = `${API_SERVER_HOST}/api/recall`;

export interface CertificationDetail {
  certNum?: string;
  certOrganName?: string;
  certState?: string;
  certDiv?: string;
  certDate?: string;
  certChgDate?: string;
  certChgReason?: string;
  makerName?: string;
  makerCntryName?: string;
  importerName?: string;
  remark?: string;
}

export interface DomesticRecallDetail {
  recallUid?: string;
  recallProductName?: string;
  recallBrandName?: string;
  recallModelName?: string;
  recallTypeName?: string;
  recallCmpnyName?: string;
  recallInqryTel?: string;
  publishDate?: string;
  harmDscr?: string;
  accidentCaseDscr?: string;
  publishActionDscr?: string;
}

export interface ForeignRecallDetail {
  fRecallUid?: string;
  recallProductName?: string;
  recallBrandName?: string;
  recallModelName?: string;
  recallTypeName?: string;
  recallPblshCntryName?: string;
  recallPblshOrgnName?: string;
  publishDate?: string;
  violateDscr?: string;
  accidentCaseDscr?: string;
  publishActionDscr?: string;
  recallProductDscr?: string;
  recallUrl?: string;
}

export const getCertificationDetail = async (
  certNum: string,
): Promise<CertificationDetail> => {
  const res = await jwtAxios.get(
    `${recallDetailPrefix}/certifications/${encodeURIComponent(certNum)}`,
  );
  return res.data;
};

export const getDomesticRecallDetail = async (
  recallUid: string,
): Promise<DomesticRecallDetail> => {
  const res = await jwtAxios.get(
    `${recallDetailPrefix}/domestic/${encodeURIComponent(recallUid)}`,
  );
  return res.data;
};

export const getForeignRecallDetail = async (
  recallUid: string,
): Promise<ForeignRecallDetail | undefined> => {
  const res = await jwtAxios.get(`${recallDetailPrefix}/foreign`, {
    params: { conditionKey: "fRecallUid", conditionValue: recallUid },
  });
  const list: ForeignRecallDetail[] = res.data;
  return list?.[0];
};
