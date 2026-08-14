import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as wishApi from "../../api/wishApi";
import type { Wish } from "../../api/wishApi";
import * as marketApi from "../../api/marketApi";
import type { MarketItem } from "../../api/marketApi";
import useCustomLogin from "../../hooks/useCustomLogin";

const MarketWishComponent = () => {
  const navigate = useNavigate();
  const { isLogin } = useCustomLogin();
  const [wishList, setWishList] = useState<Wish[]>([]);
  const [items, setItems] = useState<Record<number, MarketItem>>({});

  const loadWishList = async () => {
    const list = await wishApi.getMyWishList();
    setWishList(list);

    const entries = await Promise.all(
      list.map(
        async (wish) =>
          [wish.itemNo, await marketApi.getItem(wish.itemNo)] as const,
      ),
    );
    setItems(Object.fromEntries(entries));
  };

  useEffect(() => {
    if (!isLogin) {
      return;
    }
    loadWishList();
  }, [isLogin]);

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

  const handleUnwish = async (itemNo: number) => {
    await wishApi.toggleWish(itemNo);
    loadWishList();
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>내 찜 목록</h2>

      {wishList.length === 0 && <p>찜한 매물이 없습니다.</p>}

      {wishList.map((wish) => {
        const item = items[wish.itemNo];
        return (
          <div className="list-row" key={wish.wno}>
            {item ? (
              <>
                <span
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/market/${wish.itemNo}`)}
                >
                  {item.title} · {item.price.toLocaleString()}원
                </span>
                <button
                  className="btn ghost"
                  onClick={() => handleUnwish(wish.itemNo)}
                >
                  찜 해제
                </button>
              </>
            ) : (
              "불러오는 중..."
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MarketWishComponent;
