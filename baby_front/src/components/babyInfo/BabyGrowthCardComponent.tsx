import { useEffect, useState } from "react";
import * as babyGrowInfoApi from "../../api/babyGrowInfoApi";
import { BabyGrowInfo } from "../../api/babyGrowInfoApi";
import * as growthPercentileApi from "../../api/growthPercentileApi";
import { GrowthPercentile } from "../../api/growthPercentileApi";

interface BabyGrowthCardProps {
  babyNo: number;
}

const PAGE_SIZE = 5;

const getTodayStr = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const BabyGrowthCardComponent = ({ babyNo }: BabyGrowthCardProps) => {
  const [growList, setGrowList] = useState<BabyGrowInfo[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [percentile, setPercentile] = useState<GrowthPercentile | null>(null);
  const [measuredDate, setMeasuredDate] = useState(getTodayStr());
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");

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

  useEffect(() => {
    growthPercentileApi
      .getOne(babyNo)
      .then((data: GrowthPercentile) => setPercentile(data));
  }, [babyNo]);

  const handleRegister = async () => {
    try {
      await babyGrowInfoApi.register({
        babyNo,
        measuredDate,
        weight: weight ? Number(weight) : undefined,
        height: height ? Number(height) : undefined,
      });
      setWeight("");
      setHeight("");
      setMeasuredDate(getTodayStr());
      await loadGrowList();
    } catch (err) {
      alert("기록 추가에 실패했습니다.");
      console.error(err);
    }
  };

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

  const latestGrow = growList[0] ?? null;
  const myWeight = latestGrow?.weight ?? 0;
  const myHeight = latestGrow?.height ?? 0;
  const avgWeight = percentile?.avgWeightKg ?? 0;
  const avgHeight = percentile?.avgHeightCm ?? 0;
  const weightMax = Math.max(myWeight, avgWeight) * 1.2;
  const heightMax = Math.max(myHeight, avgHeight) * 1.2;

  return (
    <div>
      <div>
        <span>성장그래프</span>
      </div>

      {percentile && latestGrow && (
        <div>
          <p>체중(kg)</p>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 8,
              height: 100,
            }}
          >
            <div
              style={{
                width: 30,
                height: `${(myWeight / weightMax) * 100}%`,
                background: "#D4534F",
              }}
            />
            <div
              style={{
                width: 30,
                height: `${(avgWeight / weightMax) * 100}%`,
                background: "#6E9BDB",
              }}
            />
          </div>
          <span>우리아이 {myWeight}kg</span>
          <span>또래평균 {avgWeight}kg</span>

          <p>키(cm)</p>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 8,
              height: 100,
            }}
          >
            <div
              style={{
                width: 30,
                height: `${(myHeight / heightMax) * 100}%`,
                background: "#D4534F",
              }}
            />
            <div
              style={{
                width: 30,
                height: `${(avgHeight / heightMax) * 100}%`,
                background: "#6E9BDB",
              }}
            />
          </div>
          <span>우리아이 {myHeight}cm</span>
          <span>또래평균 {avgHeight}cm</span>
        </div>
      )}

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

      <div>
        <input
          type="date"
          value={measuredDate}
          onChange={(e) => setMeasuredDate(e.target.value)}
        />
        <input
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="체중(kg)"
        />
        <input
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          placeholder="키(cm)"
        />
        <button type="button" onClick={handleRegister}>
          기록 추가
        </button>
      </div>
    </div>
  );
};

export default BabyGrowthCardComponent;
