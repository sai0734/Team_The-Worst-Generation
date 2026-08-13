import { Suspense, lazy } from "react";
import type { RouteObject } from "react-router-dom";

const Loading = <div>Loading....</div>;
const Album = lazy(() => import("../pages/album/AlbumPage"));

const albumRouter = (): RouteObject[] => {
  return [
    {
      index: true,
      element: (
        <Suspense fallback={Loading}>
          <Album />
        </Suspense>
      ),
    },
  ];
};

export default albumRouter;
