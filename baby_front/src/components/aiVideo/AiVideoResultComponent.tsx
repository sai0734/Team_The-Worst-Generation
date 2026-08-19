import { BabyDiary } from "../../api/diaryApi";
import * as diaryApi from "../../api/diaryApi";

interface AiVideoResultProps {
  diary: BabyDiary | null;
  videoUrl: string | null;
}

const AiVideoResultComponent = ({ diary, videoUrl }: AiVideoResultProps) => {
  const handleDownload = () => {
    if (!videoUrl) return;
    window.open(videoUrl, "_blank");
  };

  const handleShare = async () => {
    if (!videoUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({ url: videoUrl });
      } catch (err) {
        console.error(err);
      }
    } else {
      alert("이 브라우저는 공유 기능을 지원하지 않아요.");
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-[20px] border border-[rgba(42,41,38,0.1)] bg-white p-4">
      <p className="text-sm font-bold text-[#2A2926]">
        {videoUrl ? "생성 결과" : diary ? "선택된 육아일기" : "생성 결과"}
      </p>

      {videoUrl ? (
        <video
          className="w-full h-auto rounded-[14px] bg-black"
          src={videoUrl}
          controls
        />
      ) : diary ? (
        <div className="flex flex-col gap-3">
          {diary.photoFileName ? (
            <img
              className="aspect-video w-full rounded-[14px] object-cover"
              src={diaryApi.getViewUrl(diary.photoFileName)}
              alt="일기 사진"
            />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-[14px] bg-[#EFE9DE] text-sm font-bold text-[#7A756C]">
              사진 없음
            </div>
          )}
          <p className="text-sm text-[#2A2926]">{diary.content}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-[rgba(42,41,38,0.15)] bg-white p-8 text-center">
          <span className="text-2xl">🎬</span>
          <p className="text-sm font-bold text-[#2A2926]">
            아직 생성된 영상이 없어요
          </p>
          <p className="text-xs text-[#7A756C]">
            위에서 일기를 선택하고 영상을 만들어보세요
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleShare}
          disabled={!videoUrl}
          className="flex-1 rounded-[10px] border border-[rgba(42,41,38,0.15)] py-2.5 text-sm font-bold text-[#2A2926] disabled:cursor-not-allowed disabled:opacity-40"
        >
          공유
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={!videoUrl}
          className="flex-1 rounded-[10px] bg-[#262521] py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          다운로드
        </button>
      </div>
    </div>
  );
};

export default AiVideoResultComponent;
