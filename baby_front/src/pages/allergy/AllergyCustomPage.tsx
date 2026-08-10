import { useParams } from "react-router-dom";
import CustomAllergyListComponent from "../../components/allergy/CustomAllergyListComponent";

const AllergyCustomPage = () => {
  const { babyNo } = useParams<{ babyNo: string }>();

  if (!babyNo) {
    return <div>잘못된 접근입니다.</div>;
  }

  return (
    <div>
      <CustomAllergyListComponent babyNo={Number(babyNo)} />
    </div>
  );
};

export default AllergyCustomPage;
