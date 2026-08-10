import { useParams } from "react-router-dom";
import RecipeRecommendComponent from "../../components/allergy/RecipeRecommendComponent";

const AllergyRecipePage = () => {
  const { checkNo } = useParams<{ checkNo: string }>();

  if (!checkNo) {
    return <div> 잘못된 접근입니다. </div>;
  }

  return (
    <div>
      <RecipeRecommendComponent checkNo={Number(checkNo)} />
    </div>
  );
};

export default AllergyRecipePage;
