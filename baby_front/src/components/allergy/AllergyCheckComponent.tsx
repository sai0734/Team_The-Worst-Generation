import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import * as allergyApi from "../../api/allergyApi";
import type { BabyAllergyCheck } from "../../types/allergy";

interface AllergyCheckComponentProps {
  babyNo: number;
}

const AllergyCheckComponent = ({ babyNo }: AllergyCheckComponentProps) => {
  const [image, setImage] = useState<File | null>(null);
  const [result, setResult] = useState<BabyAllergyCheck | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setImage(e.target.files?.[0] ?? null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!image) {
      alert("성분표 이미지를 선택해주세요.");
      return;
    }

    setLoading(true);
    try {
      const checked = await allergyApi.checkAllergy(babyNo, image);
      setResult(checked);
    } catch (err) {
      alert("알레르기 성분 분석에 실패했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <p className="font-semibold text-gray-900">성분표 사진 등록</p>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-sky-500 px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? "분석 중..." : "알레르기 성분 분석"}
        </button>
      </form>

      {result && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="mb-2 font-semibold text-gray-900">분석 결과</p>
          <p className="text-sm text-gray-700">
            검출된 알레르기 성분:{" "}
            {result.detectedAllergens || "검출된 성분이 없습니다."}
          </p>
          {result.detectedCustom && (
            <p className="text-sm text-gray-700">
              추가 등록 성분 일치: {result.detectedCustom}
            </p>
          )}
          {result.checkNo && (
            <Link
              to={`/allergy/recipe/${result.checkNo}?babyNo=${babyNo}`}
              className="mt-3 inline-block rounded bg-sky-500 px-4 py-2 text-sm text-white"
            >
              이 결과로 레시피 추천받기
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default AllergyCheckComponent;
