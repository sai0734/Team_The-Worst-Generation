import { ChangeEvent, FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as recallApi from "../../api/recallApi";
import type { MyProduct } from "../../api/recallApi";

const RecallFormComponent = () => {
  const navigate = useNavigate();

  const [productName, setProductName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [modelName, setModelName] = useState("");
  const [certNum, setCertNum] = useState("");

  const [ocrLoading, setOcrLoading] = useState(false);

  const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일 다시 선택해도 onChange가 다시 뜨도록
    if (!file) return;

    setOcrLoading(true);
    try {
      const result = await recallApi.extractFromImage(file);

      if (result.productName) setProductName(result.productName);
      if (result.brandName) setBrandName(result.brandName);
      if (result.modelName) setModelName(result.modelName);
      if (result.certNum) setCertNum(result.certNum);

      if (
        !result.productName &&
        !result.brandName &&
        !result.modelName &&
        !result.certNum
      ) {
        alert(
          "사진에서 제품 정보를 자동으로 읽어내지 못했어요. 아래 항목을 직접 입력해주세요.",
        );
      } else {
        alert(
          "사진에서 읽은 정보를 채워넣었어요. 내용을 확인하고 필요하면 수정해주세요.",
        );
      }
    } catch (err) {
      alert("사진 인식에 실패했습니다. 직접 입력해주세요.");
      console.error(err);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const product: MyProduct = {
      productName,
      brandName: brandName || undefined,
      modelName: modelName || undefined,
      certNum: certNum || undefined,
    };

    try {
      await recallApi.registerMyProduct(product);
      navigate("/recall");
    } catch (err) {
      alert("제품 등록에 실패했습니다.");
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>내 제품 등록</h2>

      <div className="my-4 p-4 border rounded-lg bg-gray-50">
        <p className="font-bold mb-2">제품 박스 라벨 사진으로 자동 입력</p>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoChange}
          disabled={ocrLoading}
        />
        {ocrLoading && (
          <p className="text-sm text-gray-500 mt-2">
            사진에서 정보를 읽는 중입니다...
          </p>
        )}
      </div>

      <p>제품명</p>
      <input
        value={productName}
        onChange={(e) => setProductName(e.target.value)}
        required
      />

      <p>브랜드명</p>
      <input value={brandName} onChange={(e) => setBrandName(e.target.value)} />

      <p>모델명</p>
      <input value={modelName} onChange={(e) => setModelName(e.target.value)} />

      <p>인증번호</p>
      <input
        value={certNum}
        onChange={(e) => setCertNum(e.target.value)}
        placeholder="제품 KC 인증번호가 있다면 입력하세요"
      />

      <div>
        <button type="submit">등록</button>
      </div>
    </form>
  );
};

export default RecallFormComponent;
