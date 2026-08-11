import { useEffect, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import * as marketApi from "../../api/marketApi";
import type { MarketItem } from "../../api/marketApi";
import * as wishApi from "../../api/wishApi";
import type { PageResponse } from "../../types/page";
import type { MovePageParam } from "../../hooks/useCustomMove";
import PageComponent from "../common/PageComponent";
import useCustomLogin from "../../hooks/useCustomLogin";

const MarketListComponent = () => {
  const navigate = useNavigate();
  const { isLogin } = useCustomLogin();

  const [pageResponse, setPageResponse] =
    useState<PageResponse<MarketItem> | null>(null);
  const [wishedSet, setWishedSet] = useState<Set<number>>(new Set());

  const loadList = async (pageNum: number) => {
    const res = await marketApi.getItemList({ page: pageNum, size: 10 });
    setPageResponse(res);
  };

  const loadWishSet = async () => {
    if (!isLogin) {
      return;
    }
    const list = await wishApi.getMyWishList();
    setWishedSet(new Set(list.map((w) => w.itemNo)));
  };

  useEffect(() => {
    loadList(1);
    loadWishSet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const movePage = (pageParam?: MovePageParam) => {
    loadList(pageParam?.page ?? 1);
  };

  const handleToggleWish = async (e: MouseEvent, itemNo: number) => {
    e.stopPropagation();
    const wished = await wishApi.toggleWish(itemNo);
    setWishedSet((prev) => {
      const next = new Set(prev);
      if (wished) {
        next.add(itemNo);
      } else {
        next.delete(itemNo);
      }
      return next;
    });
  };

  return (
    <div>
      {pageResponse && pageResponse.dtoList.length === 0 && (
        <div className="card">등록된 매물이 없습니다.</div>
      )}

      <div className="market-grid">
        {pageResponse?.dtoList.map((item) => (
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

              {isLogin && item.itemNo !== undefined && (
                <button
                  type="button"
                  className={`wish-btn${wishedSet.has(item.itemNo) ? " active" : ""}`}
                  onClick={(e) => handleToggleWish(e, item.itemNo as number)}
                >
                  {wishedSet.has(item.itemNo) ? "♥" : "♡"}
                </button>
              )}
            </div>

            <div className="body">
              <p className="brand">{item.category}</p>
              <p className="title">{item.title}</p>
              <div className="price-row">
                <span className="price">{item.price.toLocaleString()}원</span>
                <span
                  className={`status-badge ${item.status === "거래완료" ? "done" : "available"}`}
                >
                  {item.status}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {pageResponse && (
        <PageComponent serverData={pageResponse} movePage={movePage} />
      )}
    </div>
  );
};

export default MarketListComponent;
