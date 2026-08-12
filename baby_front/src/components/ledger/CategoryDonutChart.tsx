import { useState } from "react";
import { CATEGORY_LABELS, type LedgerCategory } from "../../api/ledgerApi";

interface CategoryDonutChartProps {
  categoryBreakdown: Partial<Record<LedgerCategory, number>>;
}

// 검증된 카테고리 팔레트(blue/orange/aqua/yellow/magenta/green), 순서 고정
const SLICE_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300"];
const OTHER_COLOR = "#a8a89f";

const RADIUS = 40;
const STROKE_WIDTH = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = CIRCUMFERENCE * 0.012;

const formatWon = (n: number) => `${n.toLocaleString()}원`;

interface Slice {
  key: string;
  label: string;
  value: number;
  color: string;
}

const CategoryDonutChart = ({ categoryBreakdown }: CategoryDonutChartProps) => {
  const [hovered, setHovered] = useState<string | null>(null);

  const entries = (Object.entries(categoryBreakdown) as [LedgerCategory, number | undefined][])
    .filter((entry): entry is [LedgerCategory, number] => (entry[1] ?? 0) > 0)
    .sort((a, b) => b[1] - a[1]);

  const top = entries.slice(0, 6);
  const restTotal = entries.slice(6).reduce((sum, [, value]) => sum + value, 0);

  const slices: Slice[] = top.map(([cat, value], i) => ({
    key: cat,
    label: CATEGORY_LABELS[cat],
    value,
    color: SLICE_COLORS[i],
  }));

  if (restTotal > 0) {
    slices.push({ key: "OTHER", label: "기타", value: restTotal, color: OTHER_COLOR });
  }

  const total = slices.reduce((sum, s) => sum + s.value, 0);

  if (total === 0) {
    return <div className="empty-hint">아직 지출 기록이 없어요</div>;
  }

  const hoveredSlice = slices.find((s) => s.key === hovered);

  let cumulative = 0;

  return (
    <div className="donut-layout">
      <svg viewBox="0 0 100 100" className="donut-chart">
        <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="var(--soft)" strokeWidth={STROKE_WIDTH} />
        {slices.map((slice) => {
          const fraction = slice.value / total;
          const sliceLength = Math.max(fraction * CIRCUMFERENCE - GAP, 0);
          const dashOffset = -cumulative;
          cumulative += fraction * CIRCUMFERENCE;

          const isHovered = hovered === slice.key;
          const isDimmed = hovered !== null && !isHovered;

          return (
            <circle
              key={slice.key}
              cx="50"
              cy="50"
              r={RADIUS}
              fill="none"
              stroke={slice.color}
              strokeWidth={isHovered ? STROKE_WIDTH + 3 : STROKE_WIDTH}
              strokeDasharray={`${sliceLength} ${CIRCUMFERENCE - sliceLength}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              opacity={isDimmed ? 0.35 : 1}
              transform="rotate(-90 50 50)"
              className="donut-slice"
              onMouseEnter={() => setHovered(slice.key)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
        <text x="50" y="47" textAnchor="middle" className="donut-center-label">
          {hoveredSlice ? hoveredSlice.label : "이번 달 지출"}
        </text>
        <text x="50" y="59" textAnchor="middle" className="donut-center-value">
          {formatWon(hoveredSlice ? hoveredSlice.value : total)}
        </text>
      </svg>

      <ul className="donut-legend">
        {slices.map((slice) => (
          <li
            key={slice.key}
            className={hovered === slice.key ? "active" : ""}
            onMouseEnter={() => setHovered(slice.key)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="donut-swatch" style={{ background: slice.color }} />
            <span className="donut-legend-label">{slice.label}</span>
            <span className="donut-legend-value">
              {formatWon(slice.value)} · {Math.round((slice.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryDonutChart;
