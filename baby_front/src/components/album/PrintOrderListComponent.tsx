import { useCallback, useEffect, useRef, useState } from "react";
import * as printOrderApi from "../../api/printOrderApi";
import { PrintOrder } from "../../api/printOrderApi";
import PrintOrderDetailModalComponent from "./PrintOrderDetailModalComponent";

interface PrintOrderListProps {
  onBack: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "결제대기",
  PAID: "결제완료",
};

const PAGE_SIZE = 10;

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
};

const PrintOrderListComponent = ({ onBack }: PrintOrderListProps) => {
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);

  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setPage((prev) => prev + 1);
      }
    });

    if (node) observerRef.current.observe(node);
  }, []);

  const loadPage = async (pageToLoad: number, reset: boolean) => {
    const result = await printOrderApi.getList({
      page: pageToLoad,
      size: PAGE_SIZE,
    });

    setOrders((prev) =>
      reset ? result.dtoList : [...prev, ...result.dtoList],
    );
    setHasMore(result.next);
    setLoading(false);
  };

  useEffect(() => {
    setPage(1);
    loadPage(1, true);
  }, []);

  useEffect(() => {
    if (page === 1) return;
    loadPage(page, false);
  }, [page]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-extrabold tracking-[3px] text-[#5AB2FF]">
            PRINT ORDER
          </p>
          <h2 className="mt-1 text-[18px] font-bold text-[#2A2926]">
            주문내역
          </h2>
        </div>
        <button
          type="button"
          className="rounded-full border border-[rgba(42,41,38,0.15)] bg-white px-4 py-2 text-xs font-bold text-[#2A2926] transition-colors hover:bg-[#EFE9DE]"
          onClick={onBack}
        >
          ← 사진 보기
        </button>
      </div>

      {loading && <p className="text-sm text-[#7A756C]">불러오는 중...</p>}

      {!loading && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-[rgba(42,41,38,0.15)] bg-white p-8 text-center">
          <span className="text-2xl">🧾</span>
          <p className="text-sm font-bold text-[#2A2926]">
            아직 주문한 인화가 없어요
          </p>
          <p className="text-xs text-[#7A756C]">
            앨범에서 사진을 골라 인화 주문을 해보세요
          </p>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <button
              key={order.orderId}
              type="button"
              className="flex items-center justify-between rounded-[16px] border border-[rgba(42,41,38,0.1)] bg-white p-4 text-left transition-colors hover:bg-[#FAF6F0]"
              onClick={() => setSelectedOrderId(order.orderId)}
            >
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[#7A756C]">
                  {formatDate(order.regTime)}
                </span>
                <span
                  className={`w-fit rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    order.status === "PAID"
                      ? "bg-[#CAF4FF] text-[#1E6FCC]"
                      : "bg-[rgba(42,41,38,0.06)] text-[#7A756C]"
                  }`}
                >
                  {STATUS_LABEL[order.status] ?? order.status}
                </span>
              </div>
              <span className="text-sm font-bold text-[#2A2926]">
                {order.totalAmount.toLocaleString()}원
              </span>
            </button>
          ))}
        </div>
      )}

      {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}

      {selectedOrderId && (
        <PrintOrderDetailModalComponent
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
};

export default PrintOrderListComponent;
