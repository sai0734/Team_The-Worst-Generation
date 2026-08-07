import { useEffect, useState } from "react";
import * as babyGrowInfoApi from "../../api/babyGrowInfoApi";
import { BabyGrowInfo } from "../../api/babyGrowInfoApi";
import BabyGrowInfoModal from "./BabyGrowInfoModalComponent";

interface BabyGrowthCardProps {
  babyNo: number;
}

const PAGE_SIZE = 5;

const BabyGrowthCardComponent = ({ babyNo }: BabyGrowthCardProps) => {
  const [growList, setGrowList] = useState<BabyGrowInfo[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [showModal, setShowModal] = useState(false);

  const loadGrowList = async () => {
    const list: BabyGrowInfo[] = await babyGrowInfoApi.getList(babyNo);
    const sorted = [...list].sort((a, b) =>
      b.measuredDate.localeCompare(a.measuredDate),
    );
    setGrowList(sorted);
  };

  useEffect(() => {
    loadGrowList();
  }, [babyNo]);

  const handleClickRemoveGrow = async (babyGrowNo?: number) => {
    if (!babyGrowNo) return;

    if (!window.confirm("이 기록을 삭제하시겠습니까?")) return;

    try {
      await babyGrowInfoApi.remove(babyGrowNo);
      await loadGrowList();
    } catch (err) {
      alert("삭제에 실패했습니다.");
      console.error(err);
    }
  };

  return (
    <div>
      <div>
        <span>성장그래프</span>
        <button type="button" onClick={() => setShowModal(true)}>
          기록 추가
        </button>
      </div>

      {growList.slice(0, visibleCount).map((grow) => (
        <div key={grow.babyGrowNo}>
          <span>{grow.measuredDate}</span>
          <span>{grow.weight}kg</span>
          <span>{grow.height}cm</span>
          <button
            type="button"
            onClick={() => handleClickRemoveGrow(grow.babyGrowNo)}
          >
            X
          </button>
        </div>
      ))}

      {growList.length > visibleCount && (
        <button
          type="button"
          onClick={() => setVisibleCount(visibleCount + PAGE_SIZE)}
        >
          더보기
        </button>
      )}

      {showModal && (
        <BabyGrowInfoModal
          babyNo={babyNo}
          onClose={() => setShowModal(false)}
          onRegistered={loadGrowList}
        />
      )}
    </div>
  );
};

export default BabyGrowthCardComponent;
