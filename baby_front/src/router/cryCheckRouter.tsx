import { Suspense, lazy } from "react";
import type { RouteObject } from "react-router-dom";

const Loading = <div>Loading....</div>;
const CryCheck = lazy(() => import("../pages/cryCheck/CryCheckPage"));

const cryCheckRouter = (): RouteObject[] => {
  return [
    {
      path: "cry-check",
      element: (
        <Suspense fallback={Loading}>
          <CryCheck />
        </Suspense>
      ),
    },
  ];
};

export default cryCheckRouter;
