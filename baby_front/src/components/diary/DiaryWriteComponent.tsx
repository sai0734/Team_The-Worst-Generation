import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { FormEvent, useState } from "react";
import * as diaryApi from "../../api/diaryApi";

interface DiaryWriteProps {
  onRegistered: () => void;
}

const DiaryWriteComponent = ({ onRegistered }: DiaryWriteProps) => {
  const currentBaby = useSelector(
    (state: RootState) => state.babySlice.currentBaby,
  );

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [content, setContent] = useState("");

  const todayLabel = new Date().toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!currentBaby?.babyNo) {
      alert("선택된 아이가 없습니다.");
      return;
    }

    const formData = new FormData();
    formData.append("babyNo", String(currentBaby.babyNo));
    formData.append("content", content);

    if (file) {
      formData.append("files", file);
    }

    try {
      await diaryApi.register(formData);
      setFile(null);
      setPreview(null);
      setContent("");
      onRegistered();
    } catch (err) {
      alert("일기 저장에 실패했습니다.");
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        {preview ? <img src={preview} alt="미리보기" /> : <div>사진</div>}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const selected = e.target.files?.[0] ?? null;
            setFile(selected);
            setPreview(selected ? URL.createObjectURL(selected) : null);
          }}
        />
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="오늘 하루는 어땠나요?"
      />
      <div>
        <span>{todayLabel}</span>
        <button type="submit">저장하기</button>
      </div>
    </form>
  );
};

export default DiaryWriteComponent;
