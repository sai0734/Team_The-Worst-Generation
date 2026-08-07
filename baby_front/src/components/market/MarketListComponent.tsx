import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as marketApi from "../../api/marketApi";
import type { MarketItem } from "../../api/marketApi";
import type { PageResponse } from "../../types/page";
import type { MovePageParam } from "../../hooks/useCustomMove";
import PageComponent from "../common/PageComponent";
import useCustomLogin from "../../hooks/useCustomLogin";

const MarketListComponent = () => {
  const navigate = useNavigate();
  const { isLogin } = useCustomLogin();

  const [pageResponse, setPageResponse] =
    useState<PageResponse<MarketItem> | null>(null);

  const loadList = async (pageNum: number) => {
    const res = await marketApi.getItemList({ page: pageNum, size: 10 });
    setPageResponse(res);
  };

  useEffect(() => {
    loadList(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const movePage = (pageParam?: MovePageParam) => {
    loadList(pageParam?.page ?? 1);
  };

  return (
    <div>
      <div>
        <h2>감자마켓</h2>
        {isLogin && (
          <>
            <button onClick={() => navigate("/market/write")}>매물 등록</button>
            <button onClick={() => navigate("/market/wish")}>내 찜</button>
            <button onClick={() => navigate("/market/chat")}>채팅</button>
            <button onClick={() => navigate("/market/mypage")}>
              내 감자밭
            </button>
          </>
        )}
      </div>

      {pageResponse && pageResponse.dtoList.length === 0 && (
        <div>등록된 매물이 없습니다.</div>
      )}

      <ul>
        {pageResponse?.dtoList.map((item) => (
          <li
            key={item.itemNo}
            onClick={() => navigate(`/market/${item.itemNo}`)}
          >
            <div>{item.title}</div>
            <div>
              {item.tradeType === "RENTAL" ? "대여" : "판매"} ·{" "}
              {item.price.toLocaleString()}원 · {item.status}
            </div>
          </li>
        ))}
      </ul>

      {pageResponse && (
        <PageComponent serverData={pageResponse} movePage={movePage} />
      )}
    </div>
  );
};

export default MarketListComponent;
