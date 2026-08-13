import { Suspense, lazy } from "react";
import type { RouteObject } from "react-router-dom";

const Loading = <div>Loading....</div>;
const Diary = lazy(() => import("../pages/diary/DiaryPage"));

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
  ];
};

export default diaryRouter;
