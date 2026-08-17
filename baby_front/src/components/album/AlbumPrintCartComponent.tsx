import { useState } from "react";
import * as printOrderApi from "../../api/printOrderApi";
import * as albumApi from "../../api/albumApi";
import { BabyAlbum } from "../../api/albumApi";
import { useKakaoPostcodePopup, Address } from "react-daum-postcode";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { ANONYMOUS, loadTossPayments } from "@tosspayments/tosspayments-sdk";

const UNIT_PRICE = 5000;

export interface PrintCartItem {
  album: BabyAlbum;
  quantity: number;
}

interface AlbumPrintCartProps {
  babyNo: number;
  items: PrintCartItem[];
  onChangeQuantity: (albumNo: number, quantity: number) => void;
  onRemoveItem: (albumNo: number) => void;
  onClose: () => void;
}

const labelClass = "text-[11px] font-bold tracking-wide text-[#7A756C]";
const inputClass =
  "w-full rounded-[12px] border border-[rgba(42,41,38,0.12)] bg-white px-3 py-2 text-sm text-[#2A2926] outline-none transition-colors focus:border-[#5AB2FF]";

const AlbumPrintCartComponent = ({
  babyNo,
  items,
  onChangeQuantity,
  onRemoveItem,
  onClose,
}: AlbumPrintCartProps) => {
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [address, setAddress] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const openPostcode = useKakaoPostcodePopup();
  const email = useSelector((state: RootState) => state.loginSlice.email);

  const handleSearchAddress = () => {
    openPostcode({
      onComplete: (data: Address) => {
        setZipcode(data.zonecode);
        setAddress(data.address);
      },
    });
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * UNIT_PRICE,
    0,
  );

  const handleSubmit = async () => {
    if (items.length === 0) {
      alert("선택된 사진이 없습니다.");
      return;
    }
    if (!receiverName || !receiverPhone || !zipcode || !address) {
      alert("받으실 분 정보를 모두 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const order = await printOrderApi.register({
        babyNo,
        receiverName,
        receiverPhone,
        zipcode,
        address,
        addressDetail,
        items: items.map((item) => ({
          albumNo: item.album.albumNo,
          quantity: item.quantity,
        })),
      });

      const tossPayments = await loadTossPayments(
        import.meta.env.VITE_TOSS_CLIENT_KEY,
      );

      const payment = tossPayments.payment({ customerKey: ANONYMOUS });

      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: order.totalAmount },
        orderId: order.orderId,
        orderName: `인화 사진 ${items.length}장`,
        successUrl: `${window.location.origin}/diary/album/print/success`,
        failUrl: `${window.location.origin}/diary/album/print/fail`,
        customerEmail: email || undefined,
        customerName: receiverName,
        card: {
          useEscrow: false,
          flowMode: "DEFAULT",
          useCardPoint: false,
          useAppCardOnly: false,
        },
      });
    } catch (err) {
      alert("결제 요청에 실패했습니다.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex w-full flex-shrink-0 flex-col overflow-hidden rounded-[24px] border border-[rgba(42,41,38,0.1)] bg-[#FAF6F0] sm:w-[360px]">
      <div className="flex items-center justify-between border-b border-[rgba(42,41,38,0.1)] p-4">
        <div>
          <p className="text-[11px] font-extrabold tracking-[3px] text-[#5AB2FF]">
            PRINT ORDER
          </p>
          <h2 className="mt-1 text-[18px] font-bold text-[#2A2926]">
            인화 주문
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

      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-2">
          {items.length === 0 && (
            <p className="text-sm text-[#7A756C]">선택된 사진이 없습니다.</p>
          )}
          {items.map((item) => (
            <div
              key={item.album.albumNo}
              className="flex items-center gap-3 rounded-[16px] border border-[rgba(42,41,38,0.1)] bg-white p-3"
            >
              <img
                className="h-[56px] w-[56px] flex-shrink-0 rounded-[10px] object-cover"
                src={albumApi.getThumbnailUrl(item.album.photoFileName)}
                alt="선택된 사진"
              />
              <div className="flex flex-1 min-w-0 flex-col gap-1">
                <span className="text-xs text-[#7A756C]">
                  {item.album.takenDate}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-[rgba(42,41,38,0.15)] text-xs font-bold text-[#2A2926]"
                    onClick={() =>
                      onChangeQuantity(
                        item.album.albumNo,
                        Math.max(item.quantity - 1, 1),
                      )
                    }
                  >
                    -
                  </button>
                  <span className="w-5 text-center text-sm font-bold text-[#2A2926]">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-[rgba(42,41,38,0.15)] text-xs font-bold text-[#2A2926]"
                    onClick={() =>
                      onChangeQuantity(item.album.albumNo, item.quantity + 1)
                    }
                  >
                    +
                  </button>
                  <span className="ml-auto text-sm font-bold text-[#2A2926]">
                    {(item.quantity * UNIT_PRICE).toLocaleString()}원
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(42,41,38,0.06)] text-xs font-bold text-[#7A756C] transition-colors hover:bg-[#f3d9d9] hover:text-[#c0392b]"
                onClick={() => onRemoveItem(item.album.albumNo)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 rounded-[16px] border border-[rgba(42,41,38,0.1)] bg-white p-4">
          <p className={labelClass}>받으실 분 정보</p>
          <input
            className={inputClass}
            placeholder="이름"
            value={receiverName}
            onChange={(e) => setReceiverName(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="전화번호"
            value={receiverPhone}
            onChange={(e) => setReceiverPhone(e.target.value)}
          />
          <div className="flex gap-2">
            <input
              className={`${inputClass} flex-1`}
              placeholder="우편번호"
              value={zipcode}
              readOnly
            />
            <button
              type="button"
              className="flex-shrink-0 rounded-[12px] border border-[rgba(42,41,38,0.15)] bg-white px-3 py-2 text-sm font-bold text-[#2A2926] transition-colors hover:bg-[#EFE9DE]"
              onClick={handleSearchAddress}
            >
              주소 검색
            </button>
          </div>
          <input
            className={inputClass}
            placeholder="주소 검색 버튼을 눌러주세요"
            value={address}
            readOnly
          />
          <input
            className={inputClass}
            placeholder="상세주소 (선택)"
            value={addressDetail}
            onChange={(e) => setAddressDetail(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[rgba(42,41,38,0.1)] p-4">
        <div>
          <p className={labelClass}>총 결제금액</p>
          <p className="text-[18px] font-bold text-[#2A2926]">
            {totalAmount.toLocaleString()}원
          </p>
        </div>
        <button
          type="button"
          disabled={submitting}
          className="rounded-full bg-[#5AB2FF] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1E6FCC] disabled:opacity-50"
          onClick={handleSubmit}
        >
          {submitting ? "처리 중..." : "결제하기"}
        </button>
      </div>
    </div>
  );
};

export default AlbumPrintCartComponent;
