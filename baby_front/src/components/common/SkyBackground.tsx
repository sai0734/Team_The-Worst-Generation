// 배경(해/달/별/구름)을 여러 페이지에서 그대로 쓰기 위해 뺀 공용 컴포넌트.
// 반드시 .home-page-inner로 감싼 뒤 그 안 첫 번째 자식으로 렌더링해야 함 - home-sky-bg의
// 절대 위치/음수 inset 계산과 배경 높이(min-height:100% + flex-shrink:0)가 그 래퍼에 의존함.
// 콘텐츠 쪽에는 이 배경 위로 뜨도록 position:relative + z-index:1을 붙여줘야 함 (theme.css 참고).
const SkyBackground = () => {
  return (
    <div className="home-sky-bg" aria-hidden="true">
      <div className="home-sky-scene">
        <span className="sky-emoji sky-sun">☀️</span>
        <span className="sky-emoji sky-moon">🌙</span>
        <span className="sky-emoji sky-star s1">⭐</span>
        <span className="sky-emoji sky-star s2">✨</span>
        <span className="sky-emoji sky-star s3">⭐</span>
        <span className="sky-emoji sky-star s4">✨</span>
        <span className="sky-emoji sky-star s5">✨</span>
        <span className="sky-emoji sky-star s6">⭐</span>
        <span className="sky-emoji sky-star s7">✨</span>
        <span className="sky-emoji sky-cloud c1">☁️</span>
        <span className="sky-emoji sky-cloud c2">☁️</span>
        <span className="sky-emoji sky-cloud c3">☁️</span>
        <span className="sky-emoji sky-cloud c4">☁️</span>
        <span className="sky-emoji sky-cloud c5">☁️</span>
        <span className="sky-emoji sky-cloud c6">☁️</span>
        <span className="sky-emoji sky-cloud c7">☁️</span>
      </div>
    </div>
  );
};

export default SkyBackground;
