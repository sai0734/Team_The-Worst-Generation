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
      className="fixed top-0 left-0 z-[1055] flex h-full w-full items-center justify-center bg-black bg-opacity-60"
      onClick={onClose}
    >
      <div
        className="bg-white rounded p-4 max-w-[80vw] max-h-[85vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={albumApi.getViewUrl(album.photoFileName)}
          alt="앨범 사진 원본"
          className="max-w-full max-h-[70vh] object-contain"
        />
        <div className="mt-2">
          <p>{album.takenDate}</p>
          <p>{getOriginalFileName(album.photoFileName)}</p>
        </div>
        <button type="button" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
};

export default AlbumDetailModalComponent;
