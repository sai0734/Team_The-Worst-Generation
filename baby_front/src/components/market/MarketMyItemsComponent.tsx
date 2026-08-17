import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as marketApi from "../../api/marketApi";
import type { MarketItem } from "../../api/marketApi";
import useCustomLogin from "../../hooks/useCustomLogin";
import { formatRelativeTime } from "../../util/relativeTime";

const MarketMyItemsComponent = () => {
  const navigate = useNavigate();
  const { isLogin } = useCustomLogin();
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    if (!isLogin) return;

    let cancelled = false;

    const loadItems = async () => {
      setLoading(true);
      try {
        const list = await marketApi.getMyItems();
        if (!cancelled) setItems(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadItems();

    return () => {
      cancelled = true;
    };
  }, [isLogin, reloadTrigger]);

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

  const handleRemove = async (itemNo?: number) => {
    if (!itemNo) return;
    if (!confirm("이 매물을 삭제할까요?")) return;
    await marketApi.removeItem(itemNo);
    setReloadTrigger((prev) => prev + 1);
  };

  return (
    <div className="card market-page-centered">
      <div className="head">
        <h2>내 매물</h2>
      </div>

      {loading ? (
        <p>불러오는 중...</p>
      ) : items.length === 0 ? (
        <p>등록한 매물이 없습니다.</p>
      ) : (
        <div className="market-grid">
          {items.map((item) => (
            <article
              className="card market-card"
              key={item.itemNo}
              onClick={() => navigate(`/market/${item.itemNo}`)}
            >
              <div className="thumb-wrap">
                {item.uploadFileNames && item.uploadFileNames.length > 0 ? (
                  <img
                    className="thumb"
                    src={marketApi.getFileUrl(item.uploadFileNames[0])}
                  />
                ) : (
                  <div className="thumb-empty">사진 없음</div>
                )}
                <span className="card-tag">
                  {item.tradeType === "RENTAL" ? "대여" : "판매"}
                </span>
              </div>
              <div className="body">
                <p className="brand">{item.category}</p>
                <p className="title">{item.title}</p>
                <div className="price-row">
                  <span className="price">{item.price.toLocaleString()}원</span>
                  <span
                    className={`status-badge ${
                      item.status === "거래완료" ? "done" : "available"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="reg-time">{formatRelativeTime(item.regTime)}</p>
                {item.status !== "거래완료" && (
                  <p
                    className="cry-check-hint"
                    style={{ margin: "6px 0 0", fontSize: 10.5 }}
                  >
                    구매자가 채팅방에서 거래완료 처리를 하면 여기에 반영돼요.
                  </p>
                )}
                <div className="market-my-item-actions">
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/market/${item.itemNo}/edit`);
                    }}
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(item.itemNo);
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketMyItemsComponent;
