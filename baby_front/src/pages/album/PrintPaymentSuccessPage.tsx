import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import * as printOrderApi from "../../api/printOrderApi";
import { PrintOrder } from "../../api/printOrderApi";

type Status = "confirming" | "done" | "error";

const PrintPaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>("confirming");
  const [order, setOrder] = useState<PrintOrder | null>(null);

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    const paymentKey = searchParams.get("paymentKey");
    const amount = searchParams.get("amount");

    if (!orderId || !paymentKey || !amount) {
      setStatus("error");
      return;
    }

    printOrderApi
      .confirm(orderId, paymentKey, Number(amount))
      .then((result) => {
        setOrder(result);
        setStatus("done");
      })
      .catch((err) => {
        console.error(err);
        setStatus("error");
      });
  }, [searchParams]);

  return (
    <div className="mx-auto flex max-w-[480px] flex-col items-center gap-4 py-16 text-center">
      {status === "confirming" && (
        <p className="text-sm text-[#7A756C]">결제를 확인하는 중입니다...</p>
      )}

      {status === "done" && order && (
        <>
          <span className="text-3xl">✅</span>
          <h1 className="text-[20px] font-bold text-[#2A2926]">
            결제가 완료됐어요
          </h1>
          <p className="text-sm text-[#7A756C]">
            주문금액 {order.totalAmount.toLocaleString()}원
          </p>
          <Link
            to="/diary/album"
            className="rounded-full bg-[#5AB2FF] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1E6FCC]"
          >
            앨범으로 돌아가기
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <span className="text-3xl">⚠️</span>
          <h1 className="text-[20px] font-bold text-[#2A2926]">
            결제 승인에 실패했어요
          </h1>
          <p className="text-sm text-[#7A756C]">
            결제 정보를 확인하지 못했습니다. 다시 시도해주세요.
          </p>
          <Link
            to="/diary/album"
            className="rounded-full border border-[rgba(42,41,38,0.15)] px-6 py-2.5 text-sm font-bold text-[#2A2926]"
          >
            앨범으로 돌아가기
          </Link>
        </>
      )}
    </div>
  );
};

export default PrintPaymentSuccessPage;
