import { FormEvent, useEffect, useState } from "react";
import * as babyInfoApi from "../../api/babyInfoApi";
import * as babyGrowInfoApi from "../../api/babyGrowInfoApi";
import { BabyInfo } from "../../api/babyInfoApi";

const BabyInfoInputComponent = () => {
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

    try {
      const result = await babyInfoApi.register(formData);
      const babyNo = result.babyNo;

      await babyGrowInfoApi.register({
        babyNo,
        measuredDate: new Date().toISOString().slice(0, 10),
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
      <button type="submit">아이 등록하기</button>

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
    </form>
  );
};

export default BabyInfoInputComponent;
