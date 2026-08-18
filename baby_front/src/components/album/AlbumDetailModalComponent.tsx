import * as albumApi from "../../api/albumApi";
import { BabyAlbum } from "../../api/albumApi";

interface AlbumDetailModalProps {
  album: BabyAlbum;
  onClose: () => void;
}

const getOriginalFileName = (photoFileName: string) => {
  const underscoreIndex = photoFileName.indexOf("_");
  return underscoreIndex === -1
    ? photoFileName
    : photoFileName.slice(underscoreIndex + 1);
};

const AlbumDetailModalComponent = ({
  album,
  onClose,
}: AlbumDetailModalProps) => {
  return (
    <div
      className="fixed inset-0 z-[1055] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-[520px] flex-col overflow-hidden rounded-[24px] bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={albumApi.getViewUrl(album.photoFileName)}
          alt="앨범 사진 원본"
          className="max-h-[60vh] w-full object-contain bg-[#EFE9DE]"
        />
        <div className="flex flex-col gap-2 overflow-y-auto p-5">
          <span className="text-xs font-bold text-[#7A756C]">
            {album.takenDate}
          </span>
          <div className="flex flex-col gap-1.5 rounded-[16px] bg-[#FAF6F0] p-4">
            <span className="text-sm font-bold text-[#2A2926]">
              {getOriginalFileName(album.photoFileName)}
            </span>
            {album.latitude != null && album.longitude != null && (
              <span className="text-xs text-[#7A756C]">
                📍 위치: {album.latitude.toFixed(4)}, {album.longitude.toFixed(4)}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          className="mx-5 mb-5 rounded-full border border-[rgba(42,41,38,0.15)] px-5 py-2.5 text-sm font-bold text-[#7A756C] transition-colors hover:bg-[#f3d9d9] hover:text-[#c0392b]"
          onClick={onClose}
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default AlbumDetailModalComponent;
