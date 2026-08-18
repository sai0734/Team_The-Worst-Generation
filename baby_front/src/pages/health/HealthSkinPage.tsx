import { useParams } from "react-router-dom";
import SkinCheckComponent from "../../components/health/SkinCheckComponent";

const HealthSkinPage = () => {
  const { babyNo } = useParams<{ babyNo: string }>();

  if (!babyNo) {
    return <div>잘못된 접근입니다.</div>;
  }

  return (
    <div>
      <SkinCheckComponent babyNo={Number(babyNo)} />
    </div>
  );
};

export default HealthSkinPage;
