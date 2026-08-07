import { lazy, Suspense } from "react";
import type { RouteObject } from "react-router-dom";

const Loading = <div>Loading....</div>;
const List = lazy(() => import("../pages/babysitter/BabysitterListPage"));
const Form = lazy(() => import("../pages/babysitter/BabysitterFormPage"));
const Detail = lazy(() => import("../pages/babysitter/BabysitterDetailPage"));

const babysitterRouter = (): RouteObject[] => {
  return [
    {
      index: true,
      element: (
        <Suspense fallback={Loading}>
          <List />
        </Suspense>
      ),
    },
    {
      path: "me/edit",
      element: (
        <Suspense fallback={Loading}>
          <Form />
        </Suspense>
      ),
    },
    {
      path: ":email",
      element: (
        <Suspense fallback={Loading}>
          <Detail />
        </Suspense>
      ),
    },
  ];
};

export default babysitterRouter;
