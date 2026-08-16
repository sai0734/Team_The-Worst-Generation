import { Suspense, lazy } from "react";
import type { RouteObject } from "react-router-dom";

const Loading = <div>Loading....</div>;
const Diary = lazy(() => import("../pages/diary/DiaryPage"));
const Album = lazy(() => import("../pages/album/AlbumPage"));

const diaryRouter = (): RouteObject[] => {
  return [
    {
      index: true,
      element: (
        <Suspense fallback={Loading}>
          <Diary />
        </Suspense>
      ),
    },
    {
      path: "album",
      element: (
        <Suspense fallback={Loading}>
          <Album />
        </Suspense>
      ),
    },
  ];
};

export default diaryRouter;
