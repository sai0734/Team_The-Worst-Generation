import { Link, useSearchParams } from "react-router-dom";

const PrintPaymentFailPage = () => {
  const [searchParams] = useSearchParams();
  const message = searchParams.get("message") ?? "결제가 취소됐어요.";

  return (
    <div className="mx-auto flex max-w-[480px] flex-col items-center gap-4 py-16 text-center">
      <span className="text-3xl">⚠️</span>
      <h1 className="text-[20px] font-bold text-[#2A2926]">
        결제가 완료되지 않았어요
      </h1>
      <p className="text-sm text-[#7A756C]">{message}</p>
      <Link
        to="/diary/album"
        className="rounded-full border border-[rgba(42,41,38,0.15)] px-6 py-2.5 text-sm font-bold text-[#2A2926]"
      >
        앨범으로 돌아가기
      </Link>
    </div>
  );
};

export default PrintPaymentFailPage;
