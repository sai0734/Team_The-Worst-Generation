import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { BabyInfo } from "../../../api/babyInfoApi";
import * as babyInfoApi from "../../../api/babyInfoApi";
import { generateStory, synthesizeStory, type StoryGenerateResponse, type StoryTheme } from "../../../api/storyApi";
import StoryLoading from "../../../components/story/StoryLoading";
import { setCurrentBaby } from "../../../slices/babySlice";
import "../../../styles/story.css";

type PageState = "form" | "loading" | "result";
const THEMES: { value: StoryTheme; label: string; icon: string }[] = [
  { value: "BEDTIME", label: "포근한 잠자리", icon: "☾" }, { value: "ADVENTURE", label: "신나는 모험", icon: "✦" },
  { value: "FRIENDSHIP", label: "다정한 우정", icon: "♡" }, { value: "HABIT", label: "좋은 습관", icon: "♧" },
  { value: "FAMILY", label: "따뜻한 가족", icon: "⌂" },
];
const ageInMonths = (birthDate: string) => {
  const birth = new Date(birthDate); const today = new Date();
  let months = (today.getFullYear() - birth.getFullYear()) * 12 + today.getMonth() - birth.getMonth();
  if (today.getDate() < birth.getDate()) months -= 1;
  return Math.max(0, months);
};
const splitPreferences = (value: string) => value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean).slice(0, 8);

const StoryPage = () => {
  const dispatch = useDispatch(); const navigate = useNavigate();
  const [babies, setBabies] = useState<BabyInfo[]>([]); const [selectedBabyNo, setSelectedBabyNo] = useState<number>();
  const [preferences, setPreferences] = useState(""); const [theme, setTheme] = useState<StoryTheme>("BEDTIME");
  const [pageState, setPageState] = useState<PageState>("form");
  const [story, setStory] = useState<StoryGenerateResponse | null>(null); const [error, setError] = useState("");
  const [audioUrl, setAudioUrl] = useState(""); const [audioLoading, setAudioLoading] = useState(false);

  useEffect(() => {
    let active = true;
    babyInfoApi.getList().then((list: BabyInfo[]) => { if (active) { setBabies(list); setSelectedBabyNo(list[0]?.babyNo); } })
      .catch(() => active && setError("아이 정보를 불러오지 못했어요."));
    return () => { active = false; };
  }, []);
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);
  const selectedBaby = useMemo(() => babies.find((baby) => baby.babyNo === selectedBabyNo), [babies, selectedBabyNo]);

  const handleCreate = async () => {
    if (!selectedBaby) return;
    setError(""); setStory(null); setPageState("loading"); dispatch(setCurrentBaby(selectedBaby));
    try {
      setStory(await generateStory({ babyName: selectedBaby.babyName, ageMonths: ageInMonths(selectedBaby.birthDate), interests: splitPreferences(preferences), favoriteItems: [], theme }));
    } catch { setError("이야기 요정이 잠시 길을 잃었어요. 잠시 후 다시 시도해 주세요."); setPageState("form"); }
  };
  const finishLoading = useCallback(() => setPageState("result"), []);
  const handleListen = async () => {
    if (!story || audioLoading) return;
    if (audioUrl) { await document.querySelector<HTMLAudioElement>("#story-audio")?.play(); return; }
    setAudioLoading(true);
    try { setAudioUrl(URL.createObjectURL(await synthesizeStory(story.content))); }
    catch { setError("지금은 동화를 읽어 주기 어려워요. 잠시 후 다시 시도해 주세요."); }
    finally { setAudioLoading(false); }
  };

  if (pageState === "loading" && selectedBaby) return <StoryLoading babyName={selectedBaby.babyName} completed={Boolean(story)} onFinish={finishLoading} />;
  if (pageState === "result" && story) return (
    <main className="story-page story-result-page">
      <header className="story-result-head"><div><span className="story-kicker">A STORY JUST FOR YOU</span><h1>{story.title}</h1><p>{selectedBaby?.babyName}만을 위해 만든 오늘의 동화예요.</p></div><img src="/story-fantasy-book.png" alt="펼쳐진 판타지 동화책" /></header>
      <article className="story-paper card"><div className="story-paper-inner">{story.content.split(/\n\n+/).map((scene, index) => <section key={`${story.storyId}-${index}`}><span>{index + 1}</span><p>{scene}</p></section>)}</div></article>
      {error && <p className="story-error" role="alert">{error}</p>}
      <div className="story-result-actions"><button type="button" className="story-secondary" onClick={() => { setPageState("form"); setError(""); }}>새 동화 만들기</button><button type="button" className="story-primary" onClick={handleListen} disabled={audioLoading}>{audioLoading ? "목소리를 준비하는 중..." : "▷ 동화 읽어주기"}</button></div>
      {audioUrl && <audio id="story-audio" className="story-audio" src={audioUrl} controls autoPlay />}
    </main>
  );

  return (
    <main className="story-page">
      {babies.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {babies.map((baby) => (
            <button
              type="button"
              key={baby.babyNo}
              onClick={() => setSelectedBabyNo(baby.babyNo)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                baby.babyNo === selectedBabyNo
                  ? "bg-[#5AB2FF] text-white"
                  : "border border-[rgba(42,41,38,0.15)] bg-white text-[#2A2926]"
              }`}
            >
              {baby.babyName}
            </button>
          ))}
        </div>
      ) : (
        <button type="button" className="story-empty-baby" onClick={() => navigate("/babyInfo/input")}>+ 먼저 아이를 등록해 주세요</button>
      )}

      <h1 className="page-hero-title text-[#2A2926]">우리 아이가 주인공인 단 하나의 동화</h1>

      <section className="story-form-grid">
        <div className="story-field-box card">
          <div className="story-label"><b>1</b><div><h2>좋아하는 것과 관심사</h2><p>쉼표로 나누어 최대 8개까지 적을 수 있어요.</p></div></div>
          <textarea value={preferences} onChange={(event) => setPreferences(event.target.value)} maxLength={320} placeholder="예: 토끼, 우주, 분홍 인형, 공룡" />
        </div>
        <div className="story-field-box card">
          <div className="story-label"><b>2</b><div><h2>어떤 이야기를 만들까요?</h2><p>오늘 아이에게 들려주고 싶은 분위기를 골라 주세요.</p></div></div>
          <div className="story-themes">{THEMES.map((item) => <button type="button" key={item.value} className={theme === item.value ? "is-selected" : ""} onClick={() => setTheme(item.value)}><i>{item.icon}</i>{item.label}</button>)}</div>
        </div>
      </section>

      {error && <p className="story-error" role="alert">{error}</p>}
      <button type="button" className="story-create-button" disabled={!selectedBaby} onClick={handleCreate}><span>✦</span> 이야기 생성하기</button>
      <p className="story-asset-credit">Book illustration: Openclipart · j4p4n</p>
    </main>
  );
};
export default StoryPage;
