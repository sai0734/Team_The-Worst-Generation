import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as wishApi from "../../api/wishApi";
import type { Wish } from "../../api/wishApi";
import * as marketApi from "../../api/marketApi";
import type { MarketItem } from "../../api/marketApi";

const MarketWishComponent = () => {
  const navigate = useNavigate();
  const [wishList, setWishList] = useState<Wish[]>([]);
  const [items, setItems] = useState<Record<number, MarketItem>>({});

  // WishDTO에 매물 제목/가격이 없어서, 찜 목록 받은 뒤 매물마다 따로 조회함
  // (찜 많아지면 비효율적 — 백엔드에서 join된 목록 API 주면 좋을 듯)
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
    loadWishList();
  }, []);

  const handleUnwish = async (itemNo: number) => {
    await wishApi.toggleWish(itemNo);
    loadWishList();
  };

  return (
    <div>
      <h2>내 찜 목록</h2>

      {wishList.length === 0 && <div>찜한 매물이 없습니다.</div>}

      <ul>
        {wishList.map((wish) => {
          const item = items[wish.itemNo];
          return (
            <li key={wish.wno}>
              {item ? (
                <>
                  <span onClick={() => navigate(`/market/${wish.itemNo}`)}>
                    {item.title} · {item.price.toLocaleString()}원
                  </span>
                  <button onClick={() => handleUnwish(wish.itemNo)}>
                    찜 해제
                  </button>
                </>
              ) : (
                "불러오는 중..."
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default MarketWishComponent;
