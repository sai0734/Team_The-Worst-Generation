import { Suspense, lazy } from "react";
import type { RouteObject } from "react-router-dom";

const Loading = <div>Loading....</div>;
const Home = lazy(() => import("../pages/walk/WalkIndexPage"));

const walkRouter = (): RouteObject[] => {
  return [
    {
      index: true,
      element: (
        <Suspense fallback={Loading}>
          <Home />
        </Suspense>
      ),
    },
  ];
};

export default walkRouter;
