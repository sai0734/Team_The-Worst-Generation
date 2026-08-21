import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as marketApi from "../../api/marketApi";
import { MARKET_CATEGORIES } from "../../api/marketApi";
import type { MarketItem } from "../../api/marketApi";
import * as marketProfileApi from "../../api/marketProfileApi";
import useCustomLogin from "../../hooks/useCustomLogin";
import { loadKakaoMapScript } from "../../util/kakaoMapLoader";

const MarketFormComponent = () => {
  const { itemNo } = useParams();
  const navigate = useNavigate();
  const { isLogin } = useCustomLogin();
  const isEdit = !!itemNo;

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [condition, setCondition] = useState("");
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [locationNotFound, setLocationNotFound] = useState(false);

  const [existingFileNames, setExistingFileNames] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapObjRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!isLogin || !isEdit || !itemNo) {
      return;
    }

    marketApi.getItem(Number(itemNo)).then((item) => {
      setTitle(item.title);
      setPrice(String(item.price));
      setDescription(item.description);
      setCategory(item.category);
      setAgeRange(item.ageRange ?? "");
      setCondition(item.condition ?? "");
      setLocationName(item.locationName ?? "");
      setLatitude(item.latitude);
      setLongitude(item.longitude);
      setExistingFileNames(item.uploadFileNames ?? []);
    });
  }, [isEdit, itemNo]);

  // 신규 등록일 때만 - 내 동네(MarketProfile)에 좌표가 설정돼 있으면 기본값으로 미리 채워둠
  // (거래 희망 장소에 새 주소를 입력하면 그 값으로 덮어써짐)
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

  // 마커를 옮기면(드래그/클릭) 그 좌표의 장소명을 역지오코딩해서 거래 희망 장소 텍스트에도 반영.
  // 건물명이 있으면(관공서 등) 건물명 우선, 없으면 도로명/지번 주소로 대체.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reverseGeocodeLocationName = (position: any) => {
    const geocoder = new (window as any).kakao.maps.services.Geocoder();
    geocoder.coord2Address(
      position.getLng(),
      position.getLat(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result: any[], status: string) => {
        if (
          status !== (window as any).kakao.maps.services.Status.OK ||
          result.length === 0
        ) {
          return;
        }
        const road = result[0].road_address;
        const jibun = result[0].address;
        const name =
          road?.building_name || road?.address_name || jibun?.address_name;
        if (name) setLocationName(name);
      },
    );
  };

  // 좌표가 생기면(주소 검색 결과 / 내 동네 기본값 / 수정 시 기존값) 지도를 그리거나 마커만 옮김.
  // 마커는 드래그 가능해서 대략적인 주소 위치에서 정확한 거래 장소로 손으로 미세조정 가능.
  useEffect(() => {
    if (latitude == null || longitude == null) return;

    let cancelled = false;

    loadKakaoMapScript().then(() => {
      if (cancelled || !mapContainerRef.current) return;

      const position = new (window as any).kakao.maps.LatLng(
        latitude,
        longitude,
      );

      if (!mapObjRef.current) {
        mapObjRef.current = new (window as any).kakao.maps.Map(
          mapContainerRef.current,
          {
            center: position,
            level: 4,
          },
        );

        markerRef.current = new (window as any).kakao.maps.Marker({
          position,
          map: mapObjRef.current,
          draggable: true,
        });

        (window as any).kakao.maps.event.addListener(
          markerRef.current,
          "dragend",
          () => {
            const pos = markerRef.current.getPosition();
            setLatitude(pos.getLat());
            setLongitude(pos.getLng());
            reverseGeocodeLocationName(pos);
          },
        );

        (window as any).kakao.maps.event.addListener(
          mapObjRef.current,
          "click",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (e: any) => {
            markerRef.current.setPosition(e.latLng);
            setLatitude(e.latLng.getLat());
            setLongitude(e.latLng.getLng());
            reverseGeocodeLocationName(e.latLng);
          },
        );
      } else {
        mapObjRef.current.setCenter(position);
        markerRef.current.setPosition(position);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

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

  // 거래 희망 장소에 주소를 입력하고 포커스를 벗어나면 좌표를 찾아서 지도를 띄움.
  // 이후 정확한 위치는 지도에서 마커를 드래그해서 맞추면 됨.
  const handleLocationBlur = async () => {
    if (!locationName.trim()) return;

    setLocationNotFound(false);
    await loadKakaoMapScript();

    const geocoder = new (window as any).kakao.maps.services.Geocoder();
    geocoder.addressSearch(
      locationName,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result: any[], status: string) => {
        if (
          status !== (window as any).kakao.maps.services.Status.OK ||
          result.length === 0
        ) {
          setLocationNotFound(true);
          return;
        }
        setLatitude(parseFloat(result[0].y));
        setLongitude(parseFloat(result[0].x));
      },
    );
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewFiles(e.target.files ? Array.from(e.target.files) : []);
  };

  const removeExistingFile = (fileName: string) => {
    setExistingFileNames((prev) => prev.filter((name) => name !== fileName));
  };

  const removeNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const item: MarketItem = {
      title,
      price: Number(price),
      description,
      tradeType: "SALE",
      category,
      ageRange: ageRange || undefined,
      condition: condition || undefined,
      allowOffer: false,
      locationName: locationName || undefined,
      latitude,
      longitude,
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
    <form className="card market-page-centered" onSubmit={handleSubmit}>
      <h2 style={{ marginTop: 0 }}>{isEdit ? "매물 수정" : "매물 등록"}</h2>

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
          type="text"
          inputMode="numeric"
          value={price ? Number(price).toLocaleString() : ""}
          onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))}
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
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
          >
            <option value="">선택 안 함</option>
            <option value="새상품">새상품</option>
            <option value="거의새것">거의새것</option>
            <option value="사용감있음">사용감있음</option>
          </select>
        </div>
      </div>

      <div className="form-field">
        <label>거래 희망 장소</label>
        <input
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          onBlur={handleLocationBlur}
          placeholder="주소를 입력하면 아래 지도에 위치가 표시돼요"
        />
        {locationNotFound && (
          <p className="alert" style={{ marginTop: 6 }}>
            주소를 찾지 못했어요. 조금 더 구체적으로 입력해보세요.
          </p>
        )}
        {latitude != null && longitude != null && (
          <>
            <div ref={mapContainerRef} className="market-form-location-map" />
            <p className="cry-check-hint" style={{ marginTop: 6 }}>
              지도의 마커를 드래그하거나 클릭해서 정확한 거래 위치로 조정할 수
              있어요.
            </p>
          </>
        )}
      </div>

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
        <label>사진 첨부 (여러 장 선택 가능)</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
        />
        {newFiles.length > 0 && (
          <div className="thumb-list">
            {newFiles.map((file, idx) => (
              <div className="thumb-remove" key={`${file.name}-${idx}`}>
                <img src={URL.createObjectURL(file)} />
                <button type="button" onClick={() => removeNewFile(idx)}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button type="submit" className="btn">
        저장
      </button>
    </form>
  );
};

export default MarketFormComponent;
