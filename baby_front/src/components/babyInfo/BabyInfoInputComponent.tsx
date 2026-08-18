import { DragEvent, FormEvent, useEffect, useState } from "react";
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
  const [isDragOver, setIsDragOver] = useState(false);
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
    try {
      const list: BabyInfo[] = await babyInfoApi.getList();
      setRegisteredList(list);
    } catch (err) {
      alert("등록된 아이 목록을 불러오지 못했습니다.");
      console.error(err);
    }
  };

  useEffect(() => {
    loadRegisteredList();
  }, []);

  useEffect(() => {
    if (!editBabyNo) return;

    babyInfoApi
      .getOne(editBabyNo)
      .then((data) => {
        setBabyName(data.babyName);
        setBirthDate(data.birthDate);
        setGender(data.gender);
        setbloodType(data.bloodType ?? "");
        setBirthWeekCount(
          data.birthWeekCount != null ? String(data.birthWeekCount) : "",
        );
        setBirthWeight(
          data.birthWeight != null ? String(data.birthWeight) : "",
        );
        setBirthHeight(
          data.birthHeight != null ? String(data.birthHeight) : "",
        );
        setHead(
          data.headCircumference != null ? String(data.headCircumference) : "",
        );
        setPreview(
          data.profileImageFileName
            ? babyInfoApi.getViewUrl(data.profileImageFileName)
            : null,
        );
      })
      .catch((err) => {
        alert("수정할 아이 정보를 불러올 수 없습니다.");
        console.error(err);
        navigate("/babyInfo");
      });
  }, [editBabyNo, navigate]);

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

    if (!babyName || !birthDate || !gender) {
      alert("이름, 생년월일, 성별은 필수 입력 항목입니다.");
      return;
    }

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

      if (weight || height) {
        await babyGrowInfoApi.register({
          babyNo,
          measuredDate: getTodayStr(),
          weight: weight ? Number(weight) : undefined,
          height: height ? Number(height) : undefined,
        });
      }
      await loadRegisteredList();
      alert(`등록이 완료되었습니다. (babyNo: ${result.babyNo})`);
    } catch (err) {
      alert("등록에 실패하셨습니다.");
      console.error(err);
    }
  };

  const labelClass =
    "block text-[11px] font-bold tracking-wide text-[#7A756C] mb-1.5";
  const inputClass =
    "w-full rounded-[14px] border border-[rgba(42,41,38,0.12)] bg-white px-4 py-2.5 text-sm text-[#2A2926] outline-none transition-colors focus:border-[#5AB2FF]";
  const pillBtn = (active: boolean) =>
    `flex-1 rounded-full border py-2.5 text-sm font-bold transition-colors ${
      active
        ? "bg-[#5AB2FF] border-[#5AB2FF] text-white"
        : "bg-white border-[rgba(42,41,38,0.15)] text-[#2A2926]"
    }`;

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-[720px] mx-auto flex flex-col gap-5 px-4 py-4 sm:gap-6 sm:px-0 sm:py-6"
    >
      {isEditMode && (
        <button
          type="button"
          className="self-start text-xs font-bold text-[#7A756C]"
          onClick={() => navigate("/babyInfo/input")}
        >
          ← 아이등록으로 돌아가기
        </button>
      )}

      <div className="text-center">
        <p className="text-[11px] font-extrabold tracking-[3px] text-[#5AB2FF]">
          BABY BOM
        </p>
        <h1 className="mt-1 text-[22px] font-bold text-[#2A2926] sm:text-[26px]">
          {isEditMode ? "아이 정보 수정" : "아이 등록하기"}
        </h1>
      </div>

      <div
        className={`relative mx-auto h-[96px] w-[96px] rounded-full sm:h-[120px] sm:w-[120px] ${
          isDragOver ? "ring-4 ring-[#5AB2FF] ring-offset-2" : ""
        }`}
        onDragOver={(e: DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e: DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          setIsDragOver(false);

          const dropped = e.dataTransfer.files?.[0] ?? null;
          if (dropped && !dropped.type.startsWith("image/")) {
            alert("이미지 파일만 등록할 수 있습니다.");
            return;
          }
          setFile(dropped);
          setPreview(dropped ? URL.createObjectURL(dropped) : null);
        }}
      >
        {preview ? (
          <img
            className="h-[96px] w-[96px] rounded-full object-cover border-4 border-[#CAF4FF] sm:h-[120px] sm:w-[120px]"
            src={preview}
            alt="미리보기"
          />
        ) : (
          <div className="h-[96px] w-[96px] rounded-full bg-gradient-to-br from-[#A0DEFF] to-[#5AB2FF] flex flex-col items-center justify-center gap-0.5 text-white sm:h-[120px] sm:w-[120px]">
            <span className="text-2xl font-bold leading-none">+</span>
            <span className="text-[10px] font-bold">사진 등록</span>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          className="absolute inset-0 cursor-pointer rounded-full opacity-0"
          onChange={(e) => {
            const selected = e.target.files?.[0] ?? null;
            setFile(selected);
            setPreview(selected ? URL.createObjectURL(selected) : null);
          }}
        />
        {preview && (
          <button
            type="button"
            className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-[#7A756C] shadow transition-colors hover:bg-[#f3d9d9] hover:text-[#c0392b]"
            onClick={(e) => {
              e.stopPropagation();
              setFile(null);
              setPreview(null);
            }}
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4 rounded-[24px] border border-[rgba(42,41,38,0.1)] bg-[#FAF6F0] p-4 sm:p-6">
        <div>
          <p className={labelClass}>이름 (필수)</p>
          <input
            className={inputClass}
            name="babyName"
            type="text"
            value={babyName}
            onChange={(e) => setBabyName(e.target.value)}
            placeholder="이름"
          />
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1 min-w-0">
            <p className={labelClass}>생년월일 (필수)</p>
            <input
              className={inputClass}
              name="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className={labelClass}>혈액형 (선택)</p>
            <select
              className={inputClass}
              value={bloodType}
              onChange={(e) => setbloodType(e.target.value)}
            >
              <option value={"A"}>A형</option>
              <option value={"B"}>B형</option>
              <option value={"AB"}>AB형</option>
              <option value={"O"}>O형</option>
            </select>
          </div>
        </div>
        <div>
          <p className={labelClass}>성별 (필수)</p>
          <div className="flex gap-2">
            <button
              className={pillBtn(gender === "남자")}
              type="button"
              value={"남자"}
              onClick={() => setGender("남자")}
            >
              남자
            </button>
            <button
              className={pillBtn(gender === "여자")}
              type="button"
              value={"여자"}
              onClick={() => setGender("여자")}
            >
              여자
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1 min-w-0">
            <p className={labelClass}>출생 주수 (선택)</p>
            <input
              className={inputClass}
              name="birthWeekCount"
              type="text"
              value={birthWeekCount}
              onChange={(e) => setBirthWeekCount(e.target.value)}
              placeholder="출생 주수"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className={labelClass}>머리둘레(cm) (선택)</p>
            <input
              className={inputClass}
              name="head"
              value={head}
              onChange={(e) => setHead(e.target.value)}
              placeholder="머리둘레(cm)"
            />
          </div>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1 min-w-0">
            <p className={labelClass}>출생 시 체중(kg) (선택)</p>
            <input
              className={inputClass}
              name="birthWeight"
              value={birthWeight}
              onChange={(e) => setBirthWeight(e.target.value)}
              placeholder="출생 시 체중(kg)"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className={labelClass}>출생 시 키(cm) (선택)</p>
            <input
              className={inputClass}
              name="birthHeight"
              value={birthHeight}
              onChange={(e) => setBirthHeight(e.target.value)}
              placeholder="출생 시 키(cm)"
            />
          </div>
        </div>
        {!isEditMode && (
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1 min-w-0">
              <p className={labelClass}>현재 체중(kg) (선택)</p>
              <input
                className={inputClass}
                name="weight"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="현재 체중(kg)"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className={labelClass}>현재 키(cm) (선택)</p>
              <input
                className={inputClass}
                name="height"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="현재 키(cm)"
              />
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="w-full rounded-full bg-[#5AB2FF] py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#1E6FCC]"
      >
        {isEditMode ? "정보 수정하기" : "아이 등록하기"}
      </button>

      {!isEditMode && (
        <div className="flex flex-col gap-3 border-t border-[rgba(42,41,38,0.1)] pt-5">
          <p className={labelClass}>등록된 아이</p>
          <div className="flex flex-col gap-2">
            {registeredList.map((baby) => (
              <div
                key={baby.babyNo}
                className="flex items-center gap-3 rounded-full border border-[rgba(42,41,38,0.1)] bg-white px-3 py-2"
              >
                {baby.profileImageFileName ? (
                  <img
                    className="h-[36px] w-[36px] rounded-full object-cover"
                    src={babyInfoApi.getViewUrl(baby.profileImageFileName)}
                    alt={baby.babyName}
                  />
                ) : (
                  <div className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#A0DEFF] text-xs text-white">
                    응애
                  </div>
                )}
                <span className="flex-1 min-w-0 truncate text-sm font-bold text-[#2A2926]">
                  {baby.babyName}
                </span>
                <button
                  className="rounded-full bg-[#CAF4FF] px-3 py-1.5 text-xs font-bold text-[#1E6FCC] transition-colors hover:bg-[#A0DEFF]"
                  type="button"
                  onClick={() => {
                    navigate(`/babyInfo/input/${baby.babyNo}`);
                  }}
                >
                  수정
                </button>
                <button
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(42,41,38,0.06)] text-xs font-bold text-[#7A756C] transition-colors hover:bg-[#f3d9d9] hover:text-[#c0392b]"
                  type="button"
                  onClick={() => handleClickRemove(baby.babyNo)}
                >
                  ✕
                </button>
              </div>
            ))}
            <div
              className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-dashed border-[rgba(42,41,38,0.2)] py-2.5 text-sm font-bold text-[#7A756C]"
              onClick={handleClickAddNew}
            >
              <span>+</span>
              <span>새 아이 추가</span>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default BabyInfoInputComponent;
