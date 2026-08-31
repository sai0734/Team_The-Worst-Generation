import { useState } from "react";
import { useDispatch } from "react-redux";
import { setCurrentBaby } from "../../slices/babySlice";
import useCustomBabyGuard from "../../hooks/useCustomBabyGuard";
import AlbumUploadComponent from "../../components/album/AlbumUploadComponent";
import AlbumGridComponent from "../../components/album/AlbumGridComponent";
import AlbumPrintCartComponent, {
  PrintCartItem,
} from "../../components/album/AlbumPrintCartComponent";
import PrintOrderListComponent from "../../components/album/PrintOrderListComponent";
import { BabyAlbum } from "../../api/albumApi";

const AlbumPage = () => {
  const dispatch = useDispatch();
  const { currentBaby, babyList } = useCustomBabyGuard();
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const [pageView, setPageView] = useState<"grid" | "orders">("grid");
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<PrintCartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  const handleRegistered = () => {
    setReloadTrigger((prev) => prev + 1);
  };

  const handleToggleSelectMode = () => {
    setIsSelectMode((prev) => !prev);
    setSelectedItems([]);
    setShowCart(false);
  };

  const handleTogglePhoto = (album: BabyAlbum) => {
    setSelectedItems((prev) => {
      const exists = prev.find((item) => item.album.albumNo === album.albumNo);
      if (exists) {
        return prev.filter((item) => item.album.albumNo !== album.albumNo);
      }
      return [...prev, { album, quantity: 1 }];
    });
  };

  const handleChangeQuantity = (albumNo: number, quantity: number) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.album.albumNo === albumNo ? { ...item, quantity } : item,
      ),
    );
  };

  const handleRemoveSelected = (albumNo: number) => {
    setSelectedItems((prev) =>
      prev.filter((item) => item.album.albumNo !== albumNo),
    );
  };

  if (!currentBaby) {
    return <div>불러오는 중...</div>;
  }

  return (
    <div className="flex w-full max-w-[1200px] mx-auto flex-col items-start gap-6 py-4 lg:flex-row">
      <div className="flex w-full min-w-0 flex-1 flex-col gap-6">
        {babyList.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {babyList.map((baby) => (
              <button
                key={baby.babyNo}
                type="button"
                onClick={() => dispatch(setCurrentBaby(baby))}
                className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                  baby.babyNo === currentBaby.babyNo
                    ? "bg-[#5AB2FF] text-white"
                    : "border border-[rgba(42,41,38,0.15)] bg-white text-[#2A2926]"
                }`}
              >
                {baby.babyName}
              </button>
            ))}
          </div>
        )}
        <h1 className="page-hero-title">{currentBaby.babyName}의 성장앨범</h1>
        {pageView === "grid" ? (
          <>
            <AlbumUploadComponent onRegistered={handleRegistered} />
            <AlbumGridComponent
              reloadTrigger={reloadTrigger}
              isSelectMode={isSelectMode}
              selectedItems={selectedItems}
              onToggleSelectMode={handleToggleSelectMode}
              onTogglePhoto={handleTogglePhoto}
              onOpenCart={() => setShowCart(true)}
              onOpenOrders={() => setPageView("orders")}
            />
          </>
        ) : (
          <PrintOrderListComponent onBack={() => setPageView("grid")} />
        )}
      </div>

      {pageView === "grid" && showCart && currentBaby?.babyNo && (
        <div className="w-full lg:sticky lg:top-6 lg:w-[360px] lg:flex-shrink-0">
          <AlbumPrintCartComponent
            babyNo={currentBaby.babyNo}
            items={selectedItems}
            onChangeQuantity={handleChangeQuantity}
            onRemoveItem={handleRemoveSelected}
            onClose={() => setShowCart(false)}
          />
        </div>
      )}
    </div>
  );
};

export default AlbumPage;
