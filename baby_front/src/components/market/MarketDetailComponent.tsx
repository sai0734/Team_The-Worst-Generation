import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as marketApi from "../../api/marketApi";
import type { MarketItem } from "../../api/marketApi";
import * as wishApi from "../../api/wishApi";
import * as chatApi from "../../api/chatApi";
import useCustomLogin from "../../hooks/useCustomLogin";
import MarketSellerQuickInfo from "./MarketSellerQuickInfo";
import MarketDetailSidebar from "./MarketDetailSidebar";

const MarketDetailComponent = () => {
  const { itemNo } = useParams();
  const navigate = useNavigate();
  const { isLogin, loginState } = useCustomLogin();

  const [item, setItem] = useState<MarketItem | null>(null);
  const [wishCount, setWishCount] = useState(0);
  const [wished, setWished] = useState(false);
  const [mainImageIndex, setMainImageIndex] = useState(0);

  const loadItem = async () => {
    if (!itemNo) {
      return;
    }
    const data = await marketApi.getItem(Number(itemNo));
    setItem(data);
    setMainImageIndex(0);
    setWishCount(await wishApi.getWishCount(Number(itemNo)));
  };

  useEffect(() => {
    if (!isLogin) {
      return;
    }

    loadItem();

    if (itemNo) {
      wishApi.getMyWishList().then((list) => {
        setWished(list.some((w) => w.itemNo === Number(itemNo)));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemNo, isLogin]);

  if (!isLogin) {
    return (
      <div className="card">
        <p>로그인이 필요한 페이지입니다.</p>
        <button className="btn" onClick={() => navigate("/member/login")}>
          로그인하러 가기
        </button>
      </div>
    );
  }

  if (!item || !itemNo) {
    return <div className="card">불러오는 중...</div>;
  }

  const isMine = loginState.email === item.sellerEmail;
  const images = item.uploadFileNames ?? [];

  const handleToggleWish = async () => {
    const result = await wishApi.toggleWish(Number(itemNo));
    setWished(result);
    setWishCount((prev) => (result ? prev + 1 : prev - 1));
  };

  const handleBump = async () => {
    await marketApi.bumpItem(Number(itemNo));
    alert("끌어올렸습니다.");
    loadItem();
  };

  const handleRemove = async () => {
    if (!confirm("매물을 삭제할까요?")) {
      return;
    }
    await marketApi.removeItem(Number(itemNo));
    navigate("/market");
  };

  const handleChat = async () => {
    const room = await chatApi.getOrCreateRoom(Number(itemNo));
    navigate(`/market/chat/${room.roomNo}`);
  };

  return (
    <div className="card detail-page">
      <div className="detail-top-row">
        <div className="detail-gallery">
          {images.length > 0 ? (
            <>
              <div className="detail-gallery-main">
                <img src={marketApi.getFileUrl(images[mainImageIndex])} />
              </div>
              {images.length > 1 && (
                <div className="detail-gallery-thumbs">
                  {images.map((fileName, idx) => (
                    <img
                      key={fileName}
                      src={marketApi.getFileUrl(fileName)}
                      className={idx === mainImageIndex ? "active" : ""}
                      onClick={() => setMainImageIndex(idx)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="detail-gallery-main empty">이미지 없음</div>
          )}
        </div>

        <MarketSellerQuickInfo item={item} />
      </div>

      <div className="detail-info-full">
        <span
          className={`status-badge ${item.status === "거래완료" ? "done" : "available"}`}
        >
          {item.status}
        </span>

        <h2 className="detail-title">{item.title}</h2>
        <div className="detail-price">{item.price.toLocaleString()}원</div>

        <div className="detail-meta">
          {item.tradeType === "RENTAL" ? "대여" : "판매"} · {item.category} ·
          판매자 {item.sellerEmail} · 조회 {item.viewCount} · 찜 {wishCount}
        </div>

        <p style={{ lineHeight: 1.7 }}>{item.description}</p>

        {item.locationName && (
          <div className="detail-meta">거래 장소: {item.locationName}</div>
        )}

        <div className="detail-actions">
          {isLogin && !isMine && (
            <>
              <button
                type="button"
                className={`detail-wish-btn${wished ? " active" : ""}`}
                onClick={handleToggleWish}
                aria-label={wished ? "찜 해제" : "찜하기"}
              >
                {wished ? "♥" : "♡"}
              </button>
              <button className="btn" onClick={handleChat}>
                채팅으로 문의하기
              </button>
            </>
          )}

          {isMine && (
            <>
              <button
                className="btn ghost"
                onClick={() => navigate(`/market/${itemNo}/edit`)}
              >
                수정
              </button>
              <button className="btn ghost" onClick={handleBump}>
                끌어올리기
              </button>
              <button className="btn ghost" onClick={handleRemove}>
                삭제
              </button>
            </>
          )}

          <button className="btn ghost" onClick={() => navigate("/market")}>
            목록으로
          </button>
        </div>
      </div>

      <MarketDetailSidebar item={item} />
    </div>
  );
};

export default MarketDetailComponent;
