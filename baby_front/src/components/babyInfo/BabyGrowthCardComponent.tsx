import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import * as babyGrowInfoApi from "../../api/babyGrowInfoApi";
import { BabyGrowInfo } from "../../api/babyGrowInfoApi";
import * as growthPercentileApi from "../../api/growthPercentileApi";
import { GrowthPercentile } from "../../api/growthPercentileApi";

interface BabyGrowthCardProps {
  babyNo: number;
}

const PAGE_SIZE = 5;

const COMPARE_COLORS = { mine: "#5AB2FF", avg: "#D9CFC1" };
const AXIS_TICK = { fill: "#7A756C", fontSize: 12 };

const labelClass = "text-[11px] font-bold tracking-wide text-[#7A756C]";
const inputClass =
  "w-full rounded-[14px] border border-[rgba(42,41,38,0.12)] bg-white px-4 py-2.5 text-sm text-[#2A2926] outline-none transition-colors focus:border-[#5AB2FF]";

const ComparisonBarChart = ({
  label,
  myValue,
  avgValue,
  unit,
  extraNote,
}: {
  label: string;
  myValue: number;
  avgValue: number;
  unit: string;
  extraNote?: string;
}) => {
  const data = [
    { name: "우리아이", value: Number(myValue.toFixed(1)) },
    { name: "또래평균", value: Number(avgValue.toFixed(1)) },
  ];

  return (
    <div className="flex-1 min-w-0 rounded-[20px] border border-[rgba(42,41,38,0.1)] bg-white p-4">
      <p className={labelClass}>
        {label}
        {extraNote ? ` (${extraNote})` : ""}
      </p>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart
          data={data}
          margin={{ top: 16, right: 0, left: 0, bottom: 0 }}
        >
          <XAxis
            dataKey="name"
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip
            formatter={(value) => `${value}${unit}`}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgba(42,41,38,0.1)",
              fontSize: 12,
            }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            <Cell fill={COMPARE_COLORS.mine} />
            <Cell fill={COMPARE_COLORS.avg} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

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
  const [showForm, setShowForm] = useState(false);

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
      setShowForm(false);
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

  const getKaupIndex = (weightKg: number, heightCm: number) =>
    ((weightKg * 1000) / (heightCm * heightCm)) * 10;

  const getKaupLabel = (index: number) => {
    if (index < 15) return "저체중";
    if (index < 19) return "정상";
    if (index < 22) return "과체중";
    return "비만";
  };

  const myKaup = myWeight && myHeight ? getKaupIndex(myWeight, myHeight) : null;
  const avgKaup =
    avgWeight && avgHeight ? getKaupIndex(avgWeight, avgHeight) : null;

  const prevGrow = growList[1] ?? null;
  const weightDelta =
    latestGrow?.weight != null && prevGrow?.weight != null
      ? latestGrow.weight - prevGrow.weight
      : null;
  const heightDelta =
    latestGrow?.height != null && prevGrow?.height != null
      ? latestGrow.height - prevGrow.height
      : null;

  const trendData = [...growList].reverse().map((g) => ({
    date: g.measuredDate,
    weight: g.weight,
    height: g.height,
  }));

  return (
    <div className="flex flex-col gap-4 rounded-[24px] border border-[rgba(42,41,38,0.1)] bg-[#FAF6F0] p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold tracking-[3px] text-[#5AB2FF]">
            GROWTH
          </p>
          <h2 className="mt-1 text-[20px] font-bold text-[#2A2926]">
            성장그래프
          </h2>
        </div>
        {!showForm && (
          <button
            className="rounded-full bg-[#5AB2FF] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1E6FCC]"
            type="button"
            onClick={() => setShowForm(true)}
          >
            + 기록 추가
          </button>
        )}
      </div>

      {!latestGrow && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-[rgba(42,41,38,0.15)] bg-white p-8 text-center">
          <span className="text-2xl">📈</span>
          <p className="text-sm font-bold text-[#2A2926]">
            아직 성장기록이 없어요
          </p>
          <p className="text-xs text-[#7A756C]">
            체중/키를 기록하면 또래 평균과 비교한 그래프가 여기에 표시됩니다
          </p>
        </div>
      )}

      {percentile && latestGrow && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <ComparisonBarChart
            label="체중(kg)"
            myValue={myWeight}
            avgValue={avgWeight}
            unit="kg"
          />
          <ComparisonBarChart
            label="키(cm)"
            myValue={myHeight}
            avgValue={avgHeight}
            unit="cm"
          />
          {myKaup !== null && avgKaup !== null && (
            <ComparisonBarChart
              label="카우프지수"
              myValue={myKaup}
              avgValue={avgKaup}
              unit=""
              extraNote={getKaupLabel(myKaup)}
            />
          )}
        </div>
      )}

      {(weightDelta !== null || heightDelta !== null) && (
        <div className="flex items-center gap-4 rounded-[16px] border border-[rgba(42,41,38,0.1)] bg-white px-4 py-3">
          <p className={labelClass}>직전 기록 대비</p>
          {weightDelta !== null && (
            <span
              className={`text-sm font-bold ${
                weightDelta >= 0 ? "text-[#1E6FCC]" : "text-[#c0392b]"
              }`}
            >
              체중 {weightDelta >= 0 ? "+" : ""}
              {weightDelta.toFixed(1)}kg
            </span>
          )}
          {heightDelta !== null && (
            <span
              className={`text-sm font-bold ${
                heightDelta >= 0 ? "text-[#1E6FCC]" : "text-[#c0392b]"
              }`}
            >
              키 {heightDelta >= 0 ? "+" : ""}
              {heightDelta.toFixed(1)}cm
            </span>
          )}
        </div>
      )}

      {trendData.length >= 2 && (
        <div className="rounded-[20px] border border-[rgba(42,41,38,0.1)] bg-white p-4">
          <p className={labelClass}>성장 추이</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(42,41,38,0.08)"
              />
              <XAxis
                dataKey="date"
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="weight"
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <YAxis
                yAxisId="height"
                orientation="right"
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid rgba(42,41,38,0.1)",
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                yAxisId="weight"
                type="monotone"
                dataKey="weight"
                name="체중(kg)"
                stroke={COMPARE_COLORS.mine}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                yAxisId="height"
                type="monotone"
                dataKey="height"
                name="키(cm)"
                stroke="#1E6FCC"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {growList.slice(0, visibleCount).map((grow) => (
          <div
            key={grow.babyGrowNo}
            className="flex items-center gap-3 rounded-full border border-[rgba(42,41,38,0.1)] bg-white px-4 py-2"
          >
            <span className="text-xs font-bold text-[#7A756C]">
              {grow.measuredDate}
            </span>
            <span className="flex-1 min-w-0 text-sm font-bold text-[#2A2926]">
              {grow.weight}kg · {grow.height}cm
            </span>
            <button
              className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(42,41,38,0.06)] text-xs font-bold text-[#7A756C] transition-colors hover:bg-[#f3d9d9] hover:text-[#c0392b]"
              type="button"
              onClick={() => handleClickRemoveGrow(grow.babyGrowNo)}
            >
              ✕
            </button>
          </div>
        ))}

        {growList.length > visibleCount && (
          <button
            className="self-center text-xs font-bold text-[#5AB2FF]"
            type="button"
            onClick={() => setVisibleCount(visibleCount + PAGE_SIZE)}
          >
            더보기
          </button>
        )}
      </div>
      {showForm && (
        <div className="flex flex-col gap-3 rounded-[20px] border border-[rgba(42,41,38,0.1)] bg-white p-4 sm:flex-row sm:items-end">
          <div className="flex-1 min-w-0">
            <p className={labelClass}>측정일</p>
            <input
              className={inputClass}
              type="date"
              value={measuredDate}
              onChange={(e) => setMeasuredDate(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className={labelClass}>체중(kg)</p>
            <input
              className={inputClass}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="체중(kg)"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className={labelClass}>키(cm)</p>
            <input
              className={inputClass}
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="키(cm)"
            />
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-full bg-[#5AB2FF] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1E6FCC]"
              type="button"
              onClick={handleRegister}
            >
              저장
            </button>
            <button
              className="rounded-full border border-[rgba(42,41,38,0.15)] px-5 py-2.5 text-sm font-bold text-[#7A756C]"
              type="button"
              onClick={() => setShowForm(false)}
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BabyGrowthCardComponent;
