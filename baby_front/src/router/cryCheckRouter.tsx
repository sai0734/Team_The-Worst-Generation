import { Suspense, lazy } from "react";
import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";

const Loading = <div>Loading....</div>;
const CryCheck = lazy(() => import("../pages/cryCheck/CryCheckPage"));
const Story = lazy(() => import("../pages/ai/story/StoryPage"));
const Recipe = lazy(() => import("../pages/ai/recipe/RecipePage"));

const cryCheckRouter = (): RouteObject[] => {
  return [
    {
      index: true,
      element: <Navigate to="cry-check" replace />,
    },
    {
      path: "cry-check",
      element: (
        <Suspense fallback={Loading}>
          <CryCheck />
        </Suspense>
      ),
    },
    {
      path: "story",
      element: (
        <Suspense fallback={Loading}>
          <Story />
        </Suspense>
      ),
    },
    {
      path: "recipe",
      element: (
        <Suspense fallback={Loading}>
          <Recipe />
        </Suspense>
      ),
    },
  ];
};

export default cryCheckRouter;
