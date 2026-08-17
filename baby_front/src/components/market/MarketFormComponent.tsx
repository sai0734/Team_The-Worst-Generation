import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as marketApi from "../../api/marketApi";
import { MARKET_CATEGORIES } from "../../api/marketApi";
import type { MarketItem } from "../../api/marketApi";
import * as marketProfileApi from "../../api/marketProfileApi";
import useCustomLogin from "../../hooks/useCustomLogin";

const MarketFormComponent = () => {
  const { itemNo } = useParams();
  const navigate = useNavigate();
  const { isLogin } = useCustomLogin();
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
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [locatingMe, setLocatingMe] = useState(false);
  const [deposit, setDeposit] = useState("");
  const [minDays, setMinDays] = useState("");
  const [maxDays, setMaxDays] = useState("");

  const [existingFileNames, setExistingFileNames] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!isLogin || !isEdit || !itemNo) {
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
      setLatitude(item.latitude);
      setLongitude(item.longitude);
      setDeposit(item.deposit !== undefined ? String(item.deposit) : "");
      setMinDays(item.minDays !== undefined ? String(item.minDays) : "");
      setMaxDays(item.maxDays !== undefined ? String(item.maxDays) : "");
      setExistingFileNames(item.uploadFileNames ?? []);
    });
  }, [isEdit, itemNo]);

  // 신규 등록일 때만 - 내 동네(MarketProfile)에 좌표가 설정돼 있으면 기본값으로 미리 채워둠
  // ("내 위치로 좌표 설정" 버튼으로 매물별로 다시 바꿀 수 있으니 그냥 기본값일 뿐)
  useEffect(() => {
    if (!isLogin || isEdit) {
      return;
    }

    marketProfileApi
      .getMyProfile()
      .then((profile) => {
        if (profile.latitude != null && profile.longitude != null) {
          setLatitude(profile.latitude);
          setLongitude(profile.longitude);
          if (profile.locationName) {
            setLocationName(profile.locationName);
          }
        }
      })
      .catch((err) => console.error(err));
  }, [isEdit]);

  if (!isLogin) {
    return (
      <div className="card">
        <p>로그인이 필요한 페이지입니다.</p>
        <button className="btn" onClick={() => navigate("/member/login")}>
          로그인하러 가기
        </button>
      </div>
    );
  }

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("이 브라우저는 위치 기능을 지원하지 않습니다.");
      return;
    }

    setLocatingMe(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocatingMe(false);
      },
      () => {
        alert(
          "위치 정보를 가져오지 못했습니다. 브라우저 위치 권한을 허용해주세요.",
        );
        setLocatingMe(false);
      },
    );
  };

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
      latitude,
      longitude,
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
    <form className="card" onSubmit={handleSubmit} style={{ maxWidth: 560 }}>
      <h2 style={{ marginTop: 0 }}>{isEdit ? "매물 수정" : "매물 등록"}</h2>

      <div className="form-field">
        <label>거래 방식</label>
        <select
          value={tradeType}
          onChange={(e) => setTradeType(e.target.value as "SALE" | "RENTAL")}
        >
          <option value="SALE">판매</option>
          <option value="RENTAL">대여</option>
        </select>
      </div>

      <div className="form-field">
        <label>제목</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="form-field">
        <label>가격</label>
        <input
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </div>

      <div className="form-field">
        <label>설명</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          required
        />
      </div>

      <div className="form-field">
        <label>카테고리</label>
        <div className="chip-row">
          {MARKET_CATEGORIES.map((c) => (
            <span
              key={c}
              className={`chip${category === c ? " is-active" : ""}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label>사용 연령대</label>
          <input
            value={ageRange}
            onChange={(e) => setAgeRange(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label>상태</label>
          <input
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            placeholder="새상품/거의새것/사용감있음 등"
          />
        </div>

        <div className="form-field">
          <label>거래 희망 장소</label>
          <input
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
          />
        </div>
      </div>

      <div className="form-field">
        <label>지도 좌표</label>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            className="btn ghost"
            onClick={handleUseCurrentLocation}
            disabled={locatingMe}
          >
            {locatingMe ? "위치 확인 중..." : "내 위치로 좌표 설정"}
          </button>
          {latitude != null && longitude != null ? (
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              설정됨 ({latitude.toFixed(5)}, {longitude.toFixed(5)})
            </span>
          ) : (
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              좌표 미설정 - 감자마켓 지도에 안 나옵니다
            </span>
          )}
        </div>
      </div>

      <div className="form-field checkbox-field">
        <input
          type="checkbox"
          id="allowOffer"
          checked={allowOffer}
          onChange={(e) => setAllowOffer(e.target.checked)}
        />
        <label htmlFor="allowOffer" style={{ margin: 0 }}>
          가격 제안 받기
        </label>
      </div>

      {tradeType === "RENTAL" && (
        <div className="form-row">
          <div className="form-field">
            <label>보증금</label>
            <input
              type="number"
              min={0}
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label>최소 대여일</label>
            <input
              type="number"
              min={0}
              value={minDays}
              onChange={(e) => setMinDays(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label>최대 대여일</label>
            <input
              type="number"
              min={0}
              value={maxDays}
              onChange={(e) => setMaxDays(e.target.value)}
            />
          </div>
        </div>
      )}

      {existingFileNames.length > 0 && (
        <div className="form-field">
          <label>기존 사진</label>
          <div className="thumb-list">
            {existingFileNames.map((fileName) => (
              <div className="thumb-remove" key={fileName}>
                <img src={marketApi.getFileUrl(fileName)} />
                <button
                  type="button"
                  onClick={() => removeExistingFile(fileName)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="form-field">
        <label>사진 첨부</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
        />
      </div>

      <button type="submit" className="btn">
        저장
      </button>
    </form>
  );
};

export default MarketFormComponent;
