import { useEffect, useState } from "react";
import heroBaby from "../../assets/hero-baby.png";

// 대시보드 배경(해/달/별/구름 + 망토 아기)을 다른 페이지에서도 그대로 쓰기 위해 뺀 공용 컴포넌트.
// BasicLayout으로 감싼 페이지 안, 콘텐츠보다 먼저 렌더링하면 됨(콘텐츠 쪽엔 이 배경 위로
// 뜨도록 .page-sky-content 클래스만 붙여주면 됨 - theme.css 참고).
const SkyBackground = () => {
  const [heroPlay, setHeroPlay] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroPlay(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="home-sky-bg" aria-hidden="true">
      <span className="sky-emoji sky-sun">☀️</span>
      <span className="sky-emoji sky-moon">🌙</span>
      <span className="sky-emoji sky-star s1">⭐</span>
      <span className="sky-emoji sky-star s2">✨</span>
      <span className="sky-emoji sky-star s3">⭐</span>
      <span className="sky-emoji sky-star s4">✨</span>
      <span className="sky-emoji sky-cloud c1">☁️</span>
      <span className="sky-emoji sky-cloud c2">☁️</span>
      <span className="sky-emoji sky-cloud c3">☁️</span>
      <span className="sky-emoji sky-cloud c4">☁️</span>
      <img
        src={heroBaby}
        alt=""
        className={`home-sky-baby${heroPlay ? " in-view" : ""}`}
      />
    </div>
  );
};

export default SkyBackground;
