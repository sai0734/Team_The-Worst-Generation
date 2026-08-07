import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as marketApi from "../../api/marketApi";
import type { MarketItem } from "../../api/marketApi";

const MarketFormComponent = () => {
  const { itemNo } = useParams();
  const navigate = useNavigate();
  const isEdit = !!itemNo;

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [tradeType, setTradeType] = useState<"SALE" | "RENTAL">("SALE");
  const [category, setCategory] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [condition, setCondition] = useState("");
  const [allowOffer, setAllowOffer] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [deposit, setDeposit] = useState("");
  const [minDays, setMinDays] = useState("");
  const [maxDays, setMaxDays] = useState("");

  const [existingFileNames, setExistingFileNames] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!isEdit || !itemNo) {
      return;
    }

    marketApi.getItem(Number(itemNo)).then((item) => {
      setTitle(item.title);
      setPrice(String(item.price));
      setDescription(item.description);
      setTradeType(item.tradeType);
      setCategory(item.category);
      setAgeRange(item.ageRange ?? "");
      setCondition(item.condition ?? "");
      setAllowOffer(item.allowOffer);
      setLocationName(item.locationName ?? "");
      setDeposit(item.deposit !== undefined ? String(item.deposit) : "");
      setMinDays(item.minDays !== undefined ? String(item.minDays) : "");
      setMaxDays(item.maxDays !== undefined ? String(item.maxDays) : "");
      setExistingFileNames(item.uploadFileNames ?? []);
    });
  }, [isEdit, itemNo]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewFiles(e.target.files ? Array.from(e.target.files) : []);
  };

  const removeExistingFile = (fileName: string) => {
    setExistingFileNames((prev) => prev.filter((name) => name !== fileName));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const item: MarketItem = {
      title,
      price: Number(price),
      description,
      tradeType,
      category,
      ageRange: ageRange || undefined,
      condition: condition || undefined,
      allowOffer,
      locationName: locationName || undefined,
      deposit: tradeType === "RENTAL" && deposit ? Number(deposit) : undefined,
      minDays: tradeType === "RENTAL" && minDays ? Number(minDays) : undefined,
      maxDays: tradeType === "RENTAL" && maxDays ? Number(maxDays) : undefined,
    };

    try {
      if (isEdit && itemNo) {
        await marketApi.modifyItem(
          Number(itemNo),
          item,
          newFiles,
          existingFileNames,
        );
        navigate(`/market/${itemNo}`);
      } else {
        const newItemNo = await marketApi.registerItem(item, newFiles);
        navigate(`/market/${newItemNo}`);
      }
    } catch (err) {
      alert("저장에 실패했습니다.");
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>{isEdit ? "매물 수정" : "매물 등록"}</h2>

      <p>거래 방식</p>
      <select
        value={tradeType}
        onChange={(e) => setTradeType(e.target.value as "SALE" | "RENTAL")}
      >
        <option value="SALE">판매</option>
        <option value="RENTAL">대여</option>
      </select>

      <p>제목</p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <p>가격</p>
      <input
        type="number"
        min={0}
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        required
      />

      <p>설명</p>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={6}
        required
      />

      <p>카테고리</p>
      <input
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        required
      />

      <p>사용 연령대</p>
      <input value={ageRange} onChange={(e) => setAgeRange(e.target.value)} />

      <p>상태</p>
      <input
        value={condition}
        onChange={(e) => setCondition(e.target.value)}
        placeholder="새상품/거의새것/사용감있음 등"
      />

      <p>
        <label>
          <input
            type="checkbox"
            checked={allowOffer}
            onChange={(e) => setAllowOffer(e.target.checked)}
          />
          가격 제안 받기
        </label>
      </p>

      <p>거래 희망 장소</p>
      <input
        value={locationName}
        onChange={(e) => setLocationName(e.target.value)}
      />

      {tradeType === "RENTAL" && (
        <>
          <p>보증금</p>
          <input
            type="number"
            min={0}
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
          />

          <p>최소 대여일</p>
          <input
            type="number"
            min={0}
            value={minDays}
            onChange={(e) => setMinDays(e.target.value)}
          />

          <p>최대 대여일</p>
          <input
            type="number"
            min={0}
            value={maxDays}
            onChange={(e) => setMaxDays(e.target.value)}
          />
        </>
      )}

      {existingFileNames.length > 0 && (
        <div>
          <p>기존 사진</p>
          {existingFileNames.map((fileName) => (
            <div key={fileName}>
              <img
                src={marketApi.getFileUrl(fileName)}
                style={{ height: 80 }}
              />
              <button
                type="button"
                onClick={() => removeExistingFile(fileName)}
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      )}

      <p>사진 첨부</p>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
      />

      <div>
        <button type="submit">저장</button>
      </div>
    </form>
  );
};

export default MarketFormComponent;
