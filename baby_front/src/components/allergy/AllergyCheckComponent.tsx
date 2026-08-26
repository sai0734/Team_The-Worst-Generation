import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import * as allergyApi from "../../api/allergyApi";
import type { BabyAllergyCheck } from "../../types/allergy";

interface AllergyCheckComponentProps {
  babyNo: number;
}

const splitList = (value?: string) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

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

  const allergens = splitList(result?.detectedAllergens);
  const customMatches = splitList(result?.detectedCustom);

  return (
    <div className="flex flex-col gap-5">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-[24px] border border-[rgba(42,41,38,0.1)] bg-[#FAF6F0] p-4 sm:p-6"
      >
        <p className="text-sm font-bold text-[#2A2926]">
          성분표 사진을 올려주세요
        </p>

        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[16px] border-2 border-dashed border-[rgba(42,41,38,0.18)] bg-white px-4 py-10 text-center transition-colors hover:border-[#5AB2FF]">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EAF6FF] text-xl">
            📷
          </span>
          <span className="text-sm font-bold text-[#2A2926]">
            {image ? image.name : "사진을 선택하거나 이 영역에 끌어다 놓으세요"}
          </span>
          <span className="text-xs text-[#7A756C]">
            과자·이유식 포장지의 성분표를 또렷하게 찍어주세요
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        <button
          type="submit"
          disabled={loading || !image}
          className="flex items-center justify-center gap-2 rounded-full bg-[#2A2926] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#453f38] disabled:cursor-not-allowed disabled:bg-[#CBD5E1]"
        >
          {loading && (
            <span className="h-3.5 w-3.5 flex-shrink-0 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {loading ? "분석 중..." : "알레르기 성분 분석"}
        </button>
      </form>

      {result && (
        <div className="flex flex-col gap-4 rounded-[24px] border border-[rgba(42,41,38,0.1)] bg-white p-4 sm:p-6">
          <p className="text-[11px] font-extrabold tracking-[2px] text-[#5AB2FF]">
            분석 결과
          </p>

          <div>
            <p className="mb-2 text-xs font-bold text-[#7A756C]">
              검출된 알레르기 성분
            </p>
            {allergens.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {allergens.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[#F3B8B0] bg-[#FDEEEC] px-3.5 py-1.5 text-xs font-bold text-[#C0392B]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#7A756C]">검출된 성분이 없어요.</p>
            )}
          </div>

          {customMatches.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold text-[#7A756C]">
                직접 등록한 알레르기 성분과 일치
              </p>
              <div className="flex flex-wrap gap-2">
                {customMatches.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[#FBD38D] bg-[#FFF7E6] px-3.5 py-1.5 text-xs font-bold text-[#B7791F]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.checkNo && (
            <Link
              to={`/allergy/recipe/${result.checkNo}?babyNo=${babyNo}`}
              className="inline-flex w-fit items-center gap-2 rounded-full bg-[#2A2926] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#453f38]"
            >
              이 결과로 레시피 추천받기 →
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default AllergyCheckComponent;
