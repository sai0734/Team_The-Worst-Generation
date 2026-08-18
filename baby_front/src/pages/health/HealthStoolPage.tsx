import { useParams } from "react-router-dom";
import StoolCheckComponent from "../../components/health/StoolCheckComponent";

const HealthStoolPage = () => {
  const { babyNo } = useParams<{ babyNo: string }>();

  if (!babyNo) {
    return <div>잘못된 접근입니다.</div>;
  }

  return (
    <div>
      <StoolCheckComponent babyNo={Number(babyNo)} />
    </div>
  );
};

export default HealthStoolPage;
