import { ChangeEvent, FormEvent, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import exifr from "exifr";
import * as albumApi from "../../api/albumApi";

interface AlbumUploadProps {
  onRegistered: () => void;
}

interface PendingPhoto {
  file: File;
  preview: string;
  takenDate: string;
  originalTakenDate: string;
  latitude: number | null;
  longitude: number | null;
  isCustomDate: boolean;
}

const getTodayStr = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const readPhotoMeta = async (file: File) => {
  let takenDate: string | null = null;
  let latitude: number | null = null;
  let longitude: number | null = null;

  try {
    const parsed = await exifr.parse(file, ["DateTimeOriginal"]);
    if (parsed?.DateTimeOriginal) {
      const exifDate: Date = parsed.DateTimeOriginal;
      const year = exifDate.getFullYear();
      const month = String(exifDate.getMonth() + 1).padStart(2, "0");
      const day = String(exifDate.getDate()).padStart(2, "0");
      takenDate = `${year}-${month}-${day}`;
    }

    const gps = await exifr.gps(file);
    if (gps) {
      latitude = gps.latitude;
      longitude = gps.longitude;
    }
  } catch (err) {
    console.error("EXIF 읽기 실패", err);
  }

  return { takenDate, latitude, longitude };
};

const AlbumUploadComponent = ({ onRegistered }: AlbumUploadProps) => {
  const currentBaby = useSelector(
    (state: RootState) => state.babySlice.currentBaby,
  );

  const [defaultTakenDate, setDefaultTakenDate] = useState(getTodayStr());
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);

  const handleDefaultDateChange = (date: string) => {
    setDefaultTakenDate(date);

    if (date === "") {
      setPhotos((prev) =>
        prev.map((photo) => ({ ...photo, takenDate: photo.originalTakenDate })),
      );
      return;
    }

    setPhotos((prev) => prev.map((photo) => ({ ...photo, takenDate: date })));
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    if (selectedFiles.length === 0) return;

    const newPhotos = await Promise.all(
      selectedFiles.map(async (file) => {
        const meta = await readPhotoMeta(file);
        const resolvedDate =
          meta.takenDate ?? (defaultTakenDate || getTodayStr());
        return {
          file,
          preview: URL.createObjectURL(file),
          takenDate: resolvedDate,
          originalTakenDate: resolvedDate,
          latitude: meta.latitude,
          longitude: meta.longitude,
          isCustomDate: meta.takenDate !== null,
        };
      }),
    );

    setPhotos((prev) => [...prev, ...newPhotos]);
    e.target.value = "";
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAllPhotos = () => {
    setPhotos([]);
  };

  const handleChangePhotoDate = (index: number, date: string) => {
    setPhotos((prev) =>
      prev.map((photo, i) =>
        i === index ? { ...photo, takenDate: date, isCustomDate: true } : photo,
      ),
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!currentBaby?.babyNo) {
      alert("선택된 아이가 없습니다.");
      return;
    }
    if (photos.length === 0) {
      alert("사진을 선택해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("babyNo", String(currentBaby.babyNo));
    formData.append(
      "metaJson",
      JSON.stringify(
        photos.map((photo) => ({
          takenDate: photo.takenDate,
          latitude: photo.latitude,
          longitude: photo.longitude,
        })),
      ),
    );
    photos.forEach((photo) => formData.append("files", photo.file));

    try {
      await albumApi.register(formData);
      setPhotos([]);
      setDefaultTakenDate(getTodayStr());
      onRegistered();
    } catch (err) {
      alert("사진 등록에 실패했습니다.");
      console.error(err);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-[24px] border border-[rgba(42,41,38,0.1)] bg-[#FAF6F0] p-4 sm:p-6"
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold tracking-[3px] text-[#5AB2FF]">
            ALBUM
          </p>
          <h2 className="mt-1 text-[18px] font-bold text-[#2A2926]">
            사진 추가
          </h2>
        </div>
        {photos.length > 0 && (
          <button
            type="button"
            className="rounded-full border border-[rgba(42,41,38,0.15)] bg-white px-4 py-2 text-xs font-bold text-[#7A756C] transition-colors hover:bg-[#f3d9d9] hover:text-[#c0392b]"
            onClick={handleClearAllPhotos}
          >
            전체 삭제
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 rounded-[16px] bg-white p-3">
        {photos.map((photo, index) => (
          <div
            key={index}
            className="flex w-[92px] flex-shrink-0 flex-col gap-1.5"
          >
            <div className="relative h-[92px] w-[92px]">
              <img
                className="h-full w-full rounded-[14px] object-cover border-2 border-[#CAF4FF]"
                src={photo.preview}
                alt={`미리보기 ${index + 1}`}
              />
              <button
                type="button"
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#7A756C] shadow transition-colors hover:bg-[#f3d9d9] hover:text-[#c0392b]"
                onClick={() => handleRemovePhoto(index)}
              >
                ✕
              </button>
              {!photo.isCustomDate && (
                <span className="absolute bottom-1.5 left-1.5 rounded-full bg-[#5AB2FF] px-1.5 py-0.5 text-[8px] font-bold text-white">
                  기본값
                </span>
              )}
            </div>
            <input
              type="date"
              className="w-full rounded-[8px] border border-[rgba(42,41,38,0.12)] bg-white px-1.5 py-1 text-[10px] font-bold text-[#7A756C] outline-none transition-colors focus:border-[#5AB2FF]"
              value={photo.takenDate}
              onChange={(e) => handleChangePhotoDate(index, e.target.value)}
            />
            {photo.latitude != null && photo.longitude != null && (
              <span
                className="truncate text-[9px] text-[#7A756C]"
                title={`${photo.latitude.toFixed(4)}, ${photo.longitude.toFixed(4)}`}
              >
                📍 위치 인식됨
              </span>
            )}
          </div>
        ))}
        <div className="relative h-[92px] w-[92px] flex-shrink-0">
          <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-[14px] border-2 border-dashed border-[#A0DEFF] bg-gradient-to-br from-[#A0DEFF]/20 to-[#5AB2FF]/20 text-[#1E6FCC] transition-colors hover:from-[#A0DEFF]/40 hover:to-[#5AB2FF]/40">
            <span className="text-xl font-bold leading-none">+</span>
            <span className="text-[9px] font-bold">사진 추가</span>
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            className="absolute inset-0 cursor-pointer rounded-[14px] opacity-0"
            onChange={handleFileChange}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <span className="text-xs font-bold text-[#7A756C]">촬영일</span>
        <input
          type="date"
          className="rounded-[12px] border border-[rgba(42,41,38,0.12)] bg-white px-3 py-2 text-sm font-bold text-[#7A756C] outline-none transition-colors focus:border-[#5AB2FF]"
          value={defaultTakenDate}
          onChange={(e) => handleDefaultDateChange(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-full bg-[#5AB2FF] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1E6FCC]"
        >
          사진 추가{photos.length > 0 ? ` (${photos.length}장)` : ""}
        </button>
      </div>
    </form>
  );
};

export default AlbumUploadComponent;
