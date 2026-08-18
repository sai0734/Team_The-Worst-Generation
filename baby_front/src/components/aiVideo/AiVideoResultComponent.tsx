interface AiVideoResultProps {
  videoUrl: string | null;
}

const AiVideoResultComponent = ({ videoUrl }: AiVideoResultProps) => {
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
      <p className="text-sm font-bold text-[#2A2926]">생성 결과</p>

      {videoUrl ? (
        <video
          className="h-[220px] w-full rounded-[14px] bg-black object-cover"
          src={videoUrl}
          controls
        />
      ) : (
        <div className="flex h-[220px] w-full items-center justify-center rounded-[14px] bg-[#1A1A18]">
          <span className="text-sm text-[#9A988F]">
            아직 생성된 영상이 없어요
          </span>
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
