import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import * as albumApi from "../../api/albumApi";
import { BabyAlbum } from "../../api/albumApi";
import AlbumDetailModalComponent from "./AlbumDetailModalComponent";

interface AlbumGridProps {
  reloadTrigger: number;
}

const PAGE_SIZE = 12;

const AlbumGridComponent = ({ reloadTrigger }: AlbumGridProps) => {
  const currentBaby = useSelector(
    (state: RootState) => state.babySlice.currentBaby,
  );

  const [list, setList] = useState<BabyAlbum[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [monthFilter, setMonthFilter] = useState<string | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<BabyAlbum | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);

  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setPage((prev) => prev + 1);
      }
    });

    if (node) observerRef.current.observe(node);
  }, []);

  const loadPage = async (pageToLoad: number, reset: boolean) => {
    if (!currentBaby?.babyNo) return;

    const result = await albumApi.getList({
      babyNo: currentBaby.babyNo,
      page: pageToLoad,
      size: PAGE_SIZE,
    });

    setList((prev) => (reset ? result.dtoList : [...prev, ...result.dtoList]));
    setHasMore(result.next);
  };

  useEffect(() => {
    setPage(1);
    loadPage(1, true);
  }, [currentBaby?.babyNo, reloadTrigger]);

  useEffect(() => {
    if (page === 1) return;
    loadPage(page, false);
  }, [page]);

  const availableMonths = Array.from(
    new Set(list.map((album) => album.takenDate.slice(0, 7))),
  ).sort((a, b) => b.localeCompare(a));

  const filteredList = monthFilter
    ? list.filter((album) => album.takenDate.slice(0, 7) === monthFilter)
    : list;

  const handleRemove = async (albumNo: number) => {
    if (!window.confirm("이 사진을 삭제하시겠습니까?")) return;

    try {
      await albumApi.remove(albumNo);
      setList((prev) => prev.filter((album) => album.albumNo !== albumNo));
    } catch (err) {
      alert("삭제에 실패했습니다.");
      console.error(err);
    }
  };

  return (
    <div>
      <div>
        <button
          type="button"
          onClick={() => setMonthFilter(null)}
          disabled={monthFilter === null}
        >
          전체
        </button>
        {availableMonths.map((month) => (
          <button
            key={month}
            type="button"
            onClick={() => setMonthFilter(month)}
            disabled={monthFilter === month}
          >
            {month}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
        }}
      >
        {filteredList.map((album) => (
          <div key={album.albumNo}>
            <img
              src={albumApi.getThumbnailUrl(album.photoFileName)}
              alt="앨범 사진"
              onClick={() => setSelectedAlbum(album)}
              style={{ cursor: "pointer" }}
            />
            <span>{album.takenDate}</span>
            <button type="button" onClick={() => handleRemove(album.albumNo)}>
              X
            </button>
          </div>
        ))}
      </div>

      {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
      {selectedAlbum && (
        <AlbumDetailModalComponent
          album={selectedAlbum}
          onClose={() => setSelectedAlbum(null)}
        />
      )}
    </div>
  );
};

export default AlbumGridComponent;
