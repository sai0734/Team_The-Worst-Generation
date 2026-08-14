import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import * as healthApi from "../../api/healthApi";
import type { BabyStoolCheck } from "../../types/health";

interface StoolCheckComponentProps {
  babyNo: number;
}

const StoolCheckComponent = ({ babyNo }: StoolCheckComponentProps) => {
  const [image, setImage] = useState<File | null>(null);
  const [result, setResult] = useState<BabyStoolCheck | null>(null);
  const [history, setHistory] = useState<BabyStoolCheck[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    const data = await healthApi.getStoolHistory(babyNo);
    setHistory(data);
  }, [babyNo]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setImage(e.target.files?.[0] ?? null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!image) {
      alert("대변 사진을 선택해주세요.");
      return;
    }

    setLoading(true);
    try {
      const checked = await healthApi.checkStool(babyNo, image);
      setResult(checked);
      await loadHistory();
    } catch (err) {
      alert("대변 상태 분석에 실패했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <p className="font-semibold text-gray-900">아기 대변 사진 등록</p>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-sky-500 px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? "분석 중..." : "대변 상태 분석"}
        </button>
      </form>

      {result && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="mb-2 font-semibold text-gray-900">분석 결과</p>
          <p className="whitespace-pre-line text-sm text-gray-700">
            {result.aiResult}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <p className="font-semibold text-gray-900">검사 이력</p>
        {history.length === 0 ? (
          <p className="text-sm text-gray-500">검사 이력이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {history.map((item) => (
              <li
                key={item.checkNo}
                className="rounded border border-gray-200 px-3 py-2"
              >
                <p className="text-xs text-gray-400">{item.regTime}</p>
                <p className="whitespace-pre-line text-sm text-gray-700">
                  {item.aiResult}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default StoolCheckComponent;
