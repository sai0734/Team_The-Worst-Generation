import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as babyInfoApi from "../../api/babyInfoApi";
import * as babyGrowInfoApi from "../../api/babyGrowInfoApi";
import { BabyInfo } from "../../api/babyInfoApi";

const getTodayStr = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const BabyInfoInputComponent = () => {
  const { babyNo: editBabyNo } = useParams<{ babyNo?: string }>();
  const isEditMode = !!editBabyNo;
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [birthWeekCount, setBirthWeekCount] = useState("");
  const [babyName, setBabyName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [bloodType, setbloodType] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [birthWeight, setBirthWeight] = useState("");
  const [birthHeight, setBirthHeight] = useState("");
  const [head, setHead] = useState("");
  const [registeredList, setRegisteredList] = useState<BabyInfo[]>([]);

  const loadRegisteredList = async () => {
    const list: BabyInfo[] = await babyInfoApi.getList();
    setRegisteredList(list);
  };

  useEffect(() => {
    loadRegisteredList();
  }, []);

  useEffect(() => {
    if (!editBabyNo) return;

    babyInfoApi.getOne(editBabyNo).then((data) => {
      setBabyName(data.babyName);
      setBirthDate(data.birthDate);
      setGender(data.gender);
      setbloodType(data.bloodType ?? "");
      setBirthWeekCount(
        data.birthWeekCount != null ? String(data.birthWeekCount) : "",
      );
      setBirthWeight(data.birthWeight != null ? String(data.birthWeight) : "");
      setBirthHeight(data.birthHeight != null ? String(data.birthHeight) : "");
      setHead(
        data.headCircumference != null ? String(data.headCircumference) : "",
      );
      setPreview(
        data.profileImageFileName
          ? babyInfoApi.getViewUrl(data.profileImageFileName)
          : null,
      );
    });
  }, [editBabyNo]);

  const handleClickAddNew = () => {
    setFile(null);
    setPreview(null);
    setBirthWeekCount("");
    setBabyName("");
    setBirthDate("");
    setGender("");
    setbloodType("");
    setWeight("");
    setHeight("");
    setBirthWeight("");
    setBirthHeight("");
    setHead("");
  };

  const handleClickRemove = async (babyNo?: number) => {
    if (!babyNo) return;
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      await babyInfoApi.remove(babyNo);
      await loadRegisteredList();
    } catch (err) {
      alert("삭제에 실패했습니다.");
      console.error(err);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("babyName", babyName);
    formData.append("birthDate", birthDate);
    formData.append("gender", gender);
    formData.append("bloodType", bloodType);
    if (birthWeekCount) {
      formData.append("birthWeekCount", birthWeekCount);
    }
    if (birthWeight) {
      formData.append("birthWeight", birthWeight);
    }
    if (birthHeight) {
      formData.append("birthHeight", birthHeight);
    }
    if (head) {
      formData.append("headCircumference", head);
    }
    if (file) {
      formData.append("files", file);
    }

    if (isEditMode) {
      try {
        await babyInfoApi.modify(formData, editBabyNo);
        alert("수정이 완료되었습니다.");
        navigate(`/babyInfo/dashboard/${editBabyNo}`);
      } catch (err) {
        alert("수정에 실패했습니다.");
        console.error(err);
      }
      return;
    }

    try {
      const result = await babyInfoApi.register(formData);
      const babyNo = result.babyNo;

      await babyGrowInfoApi.register({
        babyNo,
        measuredDate: getTodayStr(),
        weight: weight ? Number(weight) : undefined,
        height: height ? Number(height) : undefined,
      });
      await loadRegisteredList();
      alert(`등록이 완료되었습니다. (babyNo: ${result.babyNo})`);
    } catch (err) {
      alert("등록에 실패하셨습니다.");
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        {preview ? (
          <img
            className="w-[88px] h-[88px] rounded-full object-cover"
            src={preview}
            alt="미리보기"
          />
        ) : (
          <div className="w-[88px] h-[88px] rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
            사진
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const selected = e.target.files?.[0] ?? null;
            setFile(selected);
            setPreview(selected ? URL.createObjectURL(selected) : null);
          }}
        />
      </div>
      <p>이름</p>
      <input
        name="babyName"
        type="text"
        value={babyName}
        onChange={(e) => setBabyName(e.target.value)}
        placeholder="이름"
      />
      <div>
        <p>생년월일</p>
        <input
          name="birthDate"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
        />
        <p>혈액형</p>
        <select
          value={bloodType}
          onChange={(e) => setbloodType(e.target.value)}
        >
          <option value={"A"}>A형</option>
          <option value={"B"}>B형</option>
          <option value={"AB"}>AB형</option>
          <option value={"O"}>O형</option>
        </select>
      </div>
      <div>
        <p>성별</p>
        <button
          className={
            gender === "남자" ? "bg-black text-white" : "bg-white text-black"
          }
          type="button"
          value={"남자"}
          onClick={() => setGender("남자")}
        >
          남자
        </button>
        <button
          className={
            gender === "여자" ? "bg-black text-white" : "bg-white text-black"
          }
          type="button"
          value={"여자"}
          onClick={() => setGender("여자")}
        >
          여자
        </button>
      </div>
      <p>출생 주수</p>
      <input
        name="birthWeekCount"
        type="text"
        value={birthWeekCount}
        onChange={(e) => setBirthWeekCount(e.target.value)}
        placeholder="출생 주수"
      />
      {!isEditMode && (
        <div>
          <p>현재 체중(kg)</p>
          <input
            name="weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="현재 체중(kg)"
          />
          <p>현재 키(cm)</p>
          <input
            name="height"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="현재 키(cm)"
          />
        </div>
      )}

      <div>
        <p>출생 시 체중(kg)</p>
        <input
          name="birthWeight"
          value={birthWeight}
          onChange={(e) => setBirthWeight(e.target.value)}
          placeholder="출생 시 체중(kg)"
        />
        <p>출생 시 키(cm)</p>
        <input
          name="birthHeight"
          value={birthHeight}
          onChange={(e) => setBirthHeight(e.target.value)}
          placeholder="출생 시 키(cm)"
        />
      </div>
      <p>머리둘레(cm)</p>
      <input
        name="head"
        value={head}
        onChange={(e) => setHead(e.target.value)}
        placeholder="머리둘레(cm)"
      />
      <button type="submit">
        {isEditMode ? "정보 수정하기" : "아이 등록하기"}
      </button>

      {!isEditMode && (
        <div>
          <p>등록된 아이</p>
          {registeredList.map((baby) => (
            <div key={baby.babyNo}>
              {baby.profileImageFileName ? (
                <img
                  className="w-[36px] h-[36px] rounded-full object-cover"
                  src={babyInfoApi.getViewUrl(baby.profileImageFileName)}
                  alt={baby.babyName}
                />
              ) : (
                <div className="w-[36px] h-[36px] rounded-full bg-gray-200 flex items-center justify-center text-xs">
                  응애
                </div>
              )}
              <span>{baby.babyName}</span>
              <button
                type="button"
                onClick={() => {
                  navigate(`/babyInfo/input/${baby.babyNo}`);
                }}
              >
                수정
              </button>
              <button
                type="button"
                onClick={() => handleClickRemove(baby.babyNo)}
              >
                X
              </button>
            </div>
          ))}
          <div onClick={handleClickAddNew}>
            <span>+</span>
            <span>새 아이 추가</span>
          </div>
        </div>
      )}
    </form>
  );
};

export default BabyInfoInputComponent;
