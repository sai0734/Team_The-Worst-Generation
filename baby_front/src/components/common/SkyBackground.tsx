// 배경(하늘색 그라데이션 + 페이지 테두리를 따라 둥실둥실 떠있는 뭉게구름)을 여러 페이지에서
// 그대로 쓰기 위해 뺀 공용 컴포넌트.
// 반드시 .home-page-inner로 감싼 뒤 그 안 첫 번째 자식으로 렌더링해야 함 - home-sky-bg의
// 절대 위치/음수 inset 계산과 배경 높이(min-height:100% + flex-shrink:0)가 그 래퍼에 의존함.
// 콘텐츠 쪽에는 이 배경 위로 뜨도록 position:relative + z-index:1을 붙여줘야 함 (theme.css 참고).
const SkyBackground = () => {
  return (
    <div className="home-sky-bg" aria-hidden="true">
      <div className="home-sky-scene">
        <span className="puffy-cloud cloud-tl" />
        <span className="puffy-cloud cloud-tr" />
        <span className="puffy-cloud cloud-mid-left" />
        <span className="puffy-cloud cloud-mid-right" />
        <span className="cloud-bank" />
        <span className="sky-bubble b1" />
        <span className="sky-bubble b2" />
        <span className="sky-bubble b3" />
      </div>
    </div>
  );
};

export default SkyBackground;
