import { FormEvent, useState } from "react";
import * as babyInfoApi from "../../api/babyInfoApi";
import * as babyGrowInfoApi from "../../api/babyGrowInfoApi";

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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("babyName", babyName);
    formData.append("birthDate", birthDate);
    formData.append("gender", gender);
    formData.append("bloodType", bloodType);
    formData.append("birthWeekCount", birthWeekCount);
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
            src="{preview}"
            alt="미리보기"
          />
        ) : (
          <p>사진</p>
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
    </form>
  );
};

export default BabyInfoInputComponent;
