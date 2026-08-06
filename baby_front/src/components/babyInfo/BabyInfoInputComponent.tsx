import { FormEvent, useState } from "react";
import * as babyInfoApi from "../../api/babyInfoApi";

const BabyInfoInputComponent = () => {
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

    try {
      const result = await babyInfoApi.register(formData);
      alert(`등록이 완료되었습니다. (babyNo: ${result.BabyNo})`);
    } catch (err) {
      alert("등록에 실패하셨습니다.");
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>사진</div>
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
        <button type="button" value={"남자"} onClick={() => setGender("남자")}>
          남자
        </button>
        <button type="button" value={"여자"} onClick={() => setGender("여자")}>
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
