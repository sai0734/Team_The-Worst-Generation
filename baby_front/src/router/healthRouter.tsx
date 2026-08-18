import { lazy, Suspense } from "react";
import { RouteObject } from "react-router-dom";

const Loading = <div>Loading....</div>;
const Skin = lazy(() => import("../pages/health/HealthSkinPage"));
const Stool = lazy(() => import("../pages/health/HealthStoolPage"));

const healthRouter = (): RouteObject[] => {
  return [
    {
      path: "skin/:babyNo",
      element: (
        <Suspense fallback={Loading}>
          <Skin />
        </Suspense>
      ),
    },
    {
      path: "stool/:babyNo",
      element: (
        <Suspense fallback={Loading}>
          <Stool />
        </Suspense>
      ),
    },
  ];
};

export default healthRouter;
