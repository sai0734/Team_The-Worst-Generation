import { ChangeEvent, FormEvent, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import exifr from "exifr";
import * as albumApi from "../../api/albumApi";

interface AlbumUploadProps {
  onRegistered: () => void;
}

const getTodayStr = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const AlbumUploadComponent = ({ onRegistered }: AlbumUploadProps) => {
  const currentBaby = useSelector(
    (state: RootState) => state.babySlice.currentBaby,
  );

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [takenDate, setTakenDate] = useState(getTodayStr());
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setPreview(selected ? URL.createObjectURL(selected) : null);
    setLatitude(null);
    setLongitude(null);

    if (!selected) return;

    try {
      const parsed = await exifr.parse(selected, ["DateTimeOriginal"]);
      if (parsed?.DateTimeOriginal) {
        const exifDate: Date = parsed.DateTimeOriginal;
        const year = exifDate.getFullYear();
        const month = String(exifDate.getMonth() + 1).padStart(2, "0");
        const day = String(exifDate.getDate()).padStart(2, "0");
        setTakenDate(`${year}-${month}-${day}`);
      }

      const gps = await exifr.gps(selected);
      if (gps) {
        setLatitude(gps.latitude);
        setLongitude(gps.longitude);
      }
    } catch (err) {
      console.error("EXIF 읽기 실패", err);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!currentBaby?.babyNo) {
      alert("선택된 아이가 없습니다.");
      return;
    }
    if (!file) {
      alert("사진을 선택해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("babyNo", String(currentBaby.babyNo));
    formData.append("takenDate", takenDate);
    if (latitude != null) formData.append("latitude", String(latitude));
    if (longitude != null) formData.append("longitude", String(longitude));
    formData.append("files", file);

    try {
      await albumApi.register(formData);
      setFile(null);
      setPreview(null);
      setTakenDate(getTodayStr());
      setLatitude(null);
      setLongitude(null);
      onRegistered();
    } catch (err) {
      alert("사진 등록에 실패했습니다.");
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        {preview ? <img src={preview} alt="미리보기" /> : <div>사진 선택</div>}
        <input type="file" accept="image/*" onChange={handleFileChange} />
      </div>
      <p>촬영일</p>
      <input
        type="date"
        value={takenDate}
        onChange={(e) => setTakenDate(e.target.value)}
      />
      {latitude != null && longitude != null && (
        <p>
          위치 정보: {latitude.toFixed(4)}, {longitude.toFixed(4)} (사진에서
          자동 인식됨)
        </p>
      )}
      <button type="submit">사진 추가</button>
    </form>
  );
};

export default AlbumUploadComponent;
