import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as marketApi from "../../api/marketApi";
import type { MarketItem } from "../../api/marketApi";
import * as wishApi from "../../api/wishApi";
import * as chatApi from "../../api/chatApi";
import useCustomLogin from "../../hooks/useCustomLogin";

const MarketDetailComponent = () => {
  const { itemNo } = useParams();
  const navigate = useNavigate();
  const { isLogin, loginState } = useCustomLogin();

  const [item, setItem] = useState<MarketItem | null>(null);
  const [wishCount, setWishCount] = useState(0);
  const [wished, setWished] = useState(false);

  const loadItem = async () => {
    if (!itemNo) {
      return;
    }
    const data = await marketApi.getItem(Number(itemNo));
    setItem(data);
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
    <div className="card" style={{ maxWidth: 640 }}>
      {item.uploadFileNames && item.uploadFileNames.length > 0 && (
        <div className="detail-gallery">
          {item.uploadFileNames.map((fileName) => (
            <img key={fileName} src={marketApi.getFileUrl(fileName)} />
          ))}
        </div>
      )}

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

      {item.tradeType === "RENTAL" && (
        <div className="detail-meta">
          보증금 {item.deposit?.toLocaleString() ?? "-"}원 · 최소{" "}
          {item.minDays ?? "-"}일 · 최대 {item.maxDays ?? "-"}일
        </div>
      )}

      <p style={{ lineHeight: 1.7 }}>{item.description}</p>

      {item.locationName && (
        <div className="detail-meta">거래 장소: {item.locationName}</div>
      )}

      <div className="detail-actions">
        {isLogin && !isMine && (
          <>
            <button className="btn ghost" onClick={handleToggleWish}>
              {wished ? "찜 해제" : "찜하기"}
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

        <button
          className="btn ghost"
          onClick={() => navigate(`/market/profile/${item.sellerEmail}`)}
        >
          판매자 프로필 보기
        </button>

        <button className="btn ghost" onClick={() => navigate("/market")}>
          목록으로
        </button>
      </div>
    </div>
  );
};

export default MarketDetailComponent;
