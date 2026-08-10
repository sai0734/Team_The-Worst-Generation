import { lazy, Suspense } from "react";
import { RouteObject } from "react-router-dom";

const Loading = <div>Loading....</div>;
const Check = lazy(() => import("../pages/allergy/AllergyCheckPage"));
const Custom = lazy(() => import("../pages/allergy/AllergyCustomPage"));
const Ingredient = lazy(() => import("../pages/allergy/AllergyIngredientPage"));
const Recipe = lazy(() => import("../pages/allergy/AllergyRecipePage"));

const allergyRouter = (): RouteObject[] => {
  return [
    {
      path: "allergy/check/:babyNo",
      element: (
        <Suspense fallback={Loading}>
          <Check />
        </Suspense>
      ),
    },
    {
      path: "allergy/custom/:babyNo",
      element: (
        <Suspense fallback={Loading}>
          <Custom />
        </Suspense>
      ),
    },
    {
      path: "allergy/ingredient",
      element: (
        <Suspense fallback={Loading}>
          <Ingredient />
        </Suspense>
      ),
    },
    {
      path: "allergy/recipe/:checkNo",
      element: (
        <Suspense fallback={Loading}>
          <Recipe />
        </Suspense>
      ),
    },
  ];
};

export default allergyRouter;
