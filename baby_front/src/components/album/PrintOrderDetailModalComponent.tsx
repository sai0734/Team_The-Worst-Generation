import { useEffect, useState } from "react";
import * as printOrderApi from "../../api/printOrderApi";
import * as albumApi from "../../api/albumApi";
import { PrintOrder } from "../../api/printOrderApi";

interface PrintOrderDetailModalProps {
  orderId: string;
  onClose: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "결제대기",
  PAID: "결제완료",
};

const PrintOrderDetailModalComponent = ({
  orderId,
  onClose,
}: PrintOrderDetailModalProps) => {
  const [order, setOrder] = useState<PrintOrder | null>(null);

  useEffect(() => {
    printOrderApi
      .getDetail(orderId)
      .then(setOrder)
      .catch((err) => {
        alert("주문 상세정보를 불러오지 못했습니다.");
        console.error(err);
        onClose();
      });
  }, [orderId, onClose]);

  return (
    <div
      className="fixed inset-0 z-[1055] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-[480px] flex-col overflow-hidden rounded-[24px] bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[rgba(42,41,38,0.1)] p-5">
          <div>
            <p className="text-[11px] font-extrabold tracking-[3px] text-[#5AB2FF]">
              PRINT ORDER
            </p>
            <h2 className="mt-1 text-[18px] font-bold text-[#2A2926]">
              주문 상세
            </h2>
          </div>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(42,41,38,0.06)] text-sm font-bold text-[#7A756C] transition-colors hover:bg-[#f3d9d9] hover:text-[#c0392b]"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {!order ? (
          <p className="p-5 text-sm text-[#7A756C]">불러오는 중...</p>
        ) : (
          <div className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto p-5">
            <span
              className={`w-fit rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                order.status === "PAID"
                  ? "bg-[#CAF4FF] text-[#1E6FCC]"
                  : "bg-[rgba(42,41,38,0.06)] text-[#7A756C]"
              }`}
            >
              {STATUS_LABEL[order.status] ?? order.status}
            </span>

            <div className="flex flex-col gap-2">
              {order.items.map((item) => (
                <div
                  key={item.itemNo}
                  className="flex items-center gap-3 rounded-[16px] bg-[#FAF6F0] p-3"
                >
                  <img
                    className="h-[56px] w-[56px] flex-shrink-0 rounded-[10px] object-cover"
                    src={albumApi.getThumbnailUrl(item.photoFileName)}
                    alt="주문한 사진"
                  />
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-sm font-bold text-[#2A2926]">
                      {item.quantity}장
                    </span>
                    <span className="text-xs text-[#7A756C]">
                      장당 {item.unitPrice.toLocaleString()}원
                    </span>
                  </div>
                  <span className="text-sm font-bold text-[#2A2926]">
                    {(item.quantity * item.unitPrice).toLocaleString()}원
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-[16px] bg-[#FAF6F0] p-4">
              <p className="text-[11px] font-bold tracking-wide text-[#7A756C]">
                받으실 분
              </p>
              <p className="mt-1 text-sm text-[#2A2926]">
                {order.receiverName} · {order.receiverPhone}
              </p>
              <p className="text-sm text-[#2A2926]">
                ({order.zipcode}) {order.address} {order.addressDetail}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-[rgba(42,41,38,0.1)] pt-4">
              <span className="text-sm font-bold text-[#7A756C]">
                총 결제금액
              </span>
              <span className="text-[18px] font-bold text-[#2A2926]">
                {order.totalAmount.toLocaleString()}원
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintOrderDetailModalComponent;
