import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import * as albumApi from "../../api/albumApi";
import { BabyAlbum } from "../../api/albumApi";
import AlbumDetailModalComponent from "./AlbumDetailModalComponent";
import { PrintCartItem } from "./AlbumPrintCartComponent";

interface AlbumGridProps {
  reloadTrigger: number;
  isSelectMode: boolean;
  selectedItems: PrintCartItem[];
  onToggleSelectMode: () => void;
  onTogglePhoto: (album: BabyAlbum) => void;
  onOpenCart: () => void;
  onOpenOrders: () => void;
}

const PAGE_SIZE = 12;

const AlbumGridComponent = ({
  reloadTrigger,
  isSelectMode,
  selectedItems,
  onToggleSelectMode,
  onTogglePhoto,
  onOpenCart,
  onOpenOrders,
}: AlbumGridProps) => {
  const currentBaby = useSelector(
    (state: RootState) => state.babySlice.currentBaby,
  );

  const [list, setList] = useState<BabyAlbum[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<BabyAlbum | null>(null);
  const [loading, setLoading] = useState(true);

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

    if (reset) setLoading(true);
    try {
      const result = await albumApi.getList({
        babyNo: currentBaby.babyNo,
        page: pageToLoad,
        size: PAGE_SIZE,
      });

      setList((prev) => (reset ? result.dtoList : [...prev, ...result.dtoList]));
      setHasMore(result.next);
    } catch (err) {
      alert("앨범을 불러오지 못했습니다.");
      console.error(err);
    } finally {
      if (reset) setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadPage(1, true);
  }, [currentBaby?.babyNo, reloadTrigger]);

  useEffect(() => {
    if (page === 1) return;
    loadPage(page, false);
  }, [page]);

  const availableYears = Array.from(
    new Set(list.map((album) => album.takenDate.slice(0, 4))),
  ).sort((a, b) => b.localeCompare(a));

  const availableMonths = selectedYear
    ? Array.from(
        new Set(
          list
            .filter((album) => album.takenDate.slice(0, 4) === selectedYear)
            .map((album) => album.takenDate.slice(5, 7)),
        ),
      ).sort((a, b) => a.localeCompare(b))
    : [];

  const filteredList =
    selectedYear && selectedMonth
      ? list.filter(
          (album) =>
            album.takenDate.slice(0, 7) === `${selectedYear}-${selectedMonth}`,
        )
      : selectedYear
        ? list.filter((album) => album.takenDate.slice(0, 4) === selectedYear)
        : list;

  const handleSelectYear = (year: string) => {
    setSelectedYear(year === "" ? null : year);
    setSelectedMonth(null);
  };

  const handleSelectMonth = (month: string) => {
    setSelectedMonth(month === "" ? null : month);
  };

  const handleResetFilter = () => {
    setSelectedYear(null);
    setSelectedMonth(null);
  };

  const handleRemove = async (albumNo: number) => {
    if (!window.confirm("이 사진을 삭제하시겠습니까?")) return;

    try {
      await albumApi.remove(albumNo);
      setList((prev) => prev.filter((album) => album.albumNo !== albumNo));
    } catch (err) {
      const message =
        (err as any)?.response?.data?.msg ?? "삭제에 실패했습니다.";
      alert(message);
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleResetFilter}
            disabled={selectedYear === null}
            className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
              selectedYear === null
                ? "bg-[#5AB2FF] text-white"
                : "border border-[rgba(42,41,38,0.15)] bg-white text-[#2A2926]"
            }`}
          >
            전체
          </button>

          <select
            value={selectedYear ?? ""}
            onChange={(e) => handleSelectYear(e.target.value)}
            className="rounded-full border border-[rgba(42,41,38,0.15)] bg-white px-3 py-2 text-xs font-bold text-[#2A2926] outline-none"
          >
            <option value="">년도 선택</option>
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          {selectedYear && availableMonths.length > 0 && (
            <select
              value={selectedMonth ?? ""}
              onChange={(e) => handleSelectMonth(e.target.value)}
              className="rounded-full border border-[rgba(42,41,38,0.15)] bg-white px-3 py-2 text-xs font-bold text-[#7A756C] outline-none"
            >
              <option value="">월 선택</option>
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {Number(month)}월
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-full border border-[rgba(42,41,38,0.15)] bg-white px-4 py-2 text-xs font-bold text-[#2A2926] transition-colors hover:bg-[#EFE9DE]"
            onClick={onOpenOrders}
          >
            결제내역
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
              isSelectMode
                ? "border border-[rgba(42,41,38,0.15)] bg-white text-[#7A756C]"
                : "bg-[#5AB2FF] text-white hover:bg-[#1E6FCC]"
            }`}
            onClick={onToggleSelectMode}
          >
            {isSelectMode ? "선택 취소" : "인화하기"}
          </button>
        </div>
      </div>

      {!loading && filteredList.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-[rgba(42,41,38,0.15)] bg-white p-8 text-center">
          <span className="text-2xl">🖼️</span>
          <p className="text-sm font-bold text-[#2A2926]">
            아직 등록된 사진이 없어요
          </p>
          <p className="text-xs text-[#7A756C]">
            위에서 사진을 추가하면 앨범에 모여요
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {filteredList.map((album) => {
          const isSelected = selectedItems.some(
            (item) => item.album.albumNo === album.albumNo,
          );

          return (
            <div
              key={album.albumNo}
              className="group relative aspect-square overflow-hidden rounded-[16px] border border-[rgba(42,41,38,0.1)] bg-white"
            >
              <img
                className="h-full w-full cursor-pointer object-cover transition-transform group-hover:scale-105"
                src={albumApi.getThumbnailUrl(album.photoFileName)}
                alt="앨범 사진"
                onClick={() =>
                  isSelectMode ? onTogglePhoto(album) : setSelectedAlbum(album)
                }
              />
              <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-2 py-1.5 text-[11px] font-bold text-white">
                {album.takenDate}
              </span>
              {isSelectMode ? (
                <span
                  className={`absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                    isSelected
                      ? "border-[#5AB2FF] bg-[#5AB2FF] text-white"
                      : "border-white bg-white/70 text-transparent"
                  }`}
                >
                  ✓
                </span>
              ) : (
                <button
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-[#7A756C] opacity-0 transition-opacity hover:bg-[#f3d9d9] hover:text-[#c0392b] group-hover:opacity-100"
                  type="button"
                  onClick={() => handleRemove(album.albumNo)}
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>

      {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
      {selectedAlbum && (
        <AlbumDetailModalComponent
          album={selectedAlbum}
          onClose={() => setSelectedAlbum(null)}
        />
      )}

      {isSelectMode && selectedItems.length > 0 && (
        <div className="sticky bottom-4 flex items-center justify-between rounded-full border border-[rgba(42,41,38,0.1)] bg-white px-5 py-3 shadow-lg">
          <span className="text-sm font-bold text-[#2A2926]">
            {selectedItems.length}장 선택됨
          </span>
          <button
            type="button"
            className="rounded-full bg-[#5AB2FF] px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-[#1E6FCC]"
            onClick={onOpenCart}
          >
            확인
          </button>
        </div>
      )}
    </div>
  );
};

export default AlbumGridComponent;
