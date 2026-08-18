import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
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
    <div className="card">
      <div className="head">
        <h2>성분표 검사</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="photo-upload">
          <p>성분표 사진 등록</p>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <p className="photo-hint">
            성분표가 잘 보이도록 촬영해서 올려주세요.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="submit-btn"
          style={{ marginTop: 14, width: "100%" }}
        >
          {loading ? "분석 중..." : "알레르기 성분 분석"}
        </button>
      </form>

      {result && (
        <div className="card" style={{ marginTop: 16 }}>
          <p className="eyebrow">분석 결과</p>
          <p style={{ marginTop: 8 }}>
            검출된 알레르기 성분:{" "}
            {result.detectedAllergens || "검출된 성분이 없습니다."}
          </p>
          {result.detectedCustom && (
            <p style={{ marginTop: 6 }}>
              추가 등록 성분 일치: {result.detectedCustom}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AllergyCheckComponent;
