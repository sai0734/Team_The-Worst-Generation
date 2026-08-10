import { useParams } from "react-router-dom";
import AllergyCheckComponent from "../../components/allergy/AllergyCheckComponent";

const AllergyCheckPage = () => {
  const { babyNo } = useParams<{ babyNo: string }>();

  if (!babyNo) {
    return <div>잘못된 접근입니다.</div>;
  }

  return (
    <div>
      <AllergyCheckComponent babyNo={Number(babyNo)} />
    </div>
  );
};

export default AllergyCheckPage;
