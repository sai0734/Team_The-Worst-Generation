import { useState } from "react";
import * as babyGrowInfoApi from "../../api/babyGrowInfoApi";

interface BabyGrowInfoModalProps {
  babyNo: number;
  onClose: () => void;
  onRegistered: () => void;
}

const getTodayStr = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const BabyGrowInfoModalComponent = ({
  babyNo,
  onClose,
  onRegistered,
}: BabyGrowInfoModalProps) => {
  const [measuredDate, setMeasuredDate] = useState(getTodayStr());

  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");

  const handleSubmit = async () => {
    try {
      await babyGrowInfoApi.register({
        babyNo,
        measuredDate,
        weight: weight ? Number(weight) : undefined,
        height: height ? Number(height) : undefined,
      });
      onRegistered();
      onClose();
    } catch (err) {
      alert("기록 추가에 실패했습니다.");
      console.error(err);
    }
  };

  return (
    <div
      className="fixed top-0 left-0 z-[1055] flex h-full w-full justify-center bg-black bg-opacity-20"
      onClick={onClose}
    >
      <div
        className="absolute bg-white shadow opacity-100 w-1/4 rounded mt-10 mb-10 px-6 min-w-[320px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-xl border-b-2 border-gray-300 py-4">기록 추가</div>
        <div className="py-4">
          <p>측정일</p>
          <input
            type="date"
            value={measuredDate}
            onChange={(e) => setMeasuredDate(e.target.value)}
          />
          <p>체중(kg)</p>
          <input
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="체중(kg)"
          />
          <p>키(cm)</p>
          <input
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="키(cm)"
          />
        </div>
        <div className="flex justify-end gap-2 pb-4">
          <button type="button" onClick={onClose}>
            취소
          </button>
          <button type="button" onClick={handleSubmit}>
            추가
          </button>
        </div>
      </div>
    </div>
  );
};

export default BabyGrowInfoModalComponent;
