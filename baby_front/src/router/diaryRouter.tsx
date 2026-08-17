import { Suspense, lazy } from "react";
import type { RouteObject } from "react-router-dom";

const Loading = <div>Loading....</div>;
const Diary = lazy(() => import("../pages/diary/DiaryPage"));
const Album = lazy(() => import("../pages/album/AlbumPage"));
const PrintPaymentSuccess = lazy(
  () => import("../pages/album/PrintPaymentSuccessPage"),
);
const PrintPaymentFail = lazy(
  () => import("../pages/album/PrintPaymentFailPage"),
);

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
    {
      path: "album/print/success",
      element: (
        <Suspense fallback={Loading}>
          <PrintPaymentSuccess />
        </Suspense>
      ),
    },
    {
      path: "album/print/fail",
      element: (
        <Suspense fallback={Loading}>
          <PrintPaymentFail />
        </Suspense>
      ),
    },
  ];
};

export default diaryRouter;
