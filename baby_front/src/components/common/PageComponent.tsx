import type { PageResponse } from "../../types/page";
import type { MovePageParam } from "../../hooks/useCustomMove";

interface PageComponentProps {
  serverData: PageResponse<any>;
  movePage: (pageParam?: MovePageParam) => void;
}

const PageComponent = ({ serverData, movePage }: PageComponentProps) => {
  return (
    <div className="ledger-pagination">
      {serverData.prev && (
        <button
          type="button"
          className="entry-action-btn"
          onClick={() => movePage({ page: serverData.prevPage })}
        >
          이전
        </button>
      )}

      {serverData.pageNumList.map((pageNum) => (
        <button
          type="button"
          key={pageNum}
          className={`entry-action-btn${serverData.current === pageNum ? " active" : ""}`}
          onClick={() => movePage({ page: pageNum })}
        >
          {pageNum}
        </button>
      ))}

      {serverData.next && (
        <button
          type="button"
          className="entry-action-btn"
          onClick={() => movePage({ page: serverData.nextPage })}
        >
          다음
        </button>
      )}
    </div>
  );
};

export default PageComponent;
