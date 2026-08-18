import { Suspense, lazy } from "react";
import type { RouteObject } from "react-router-dom";

const Loading = <div>Loading....</div>;
const List = lazy(() => import("../pages/recall/RecallListPage"));
const Form = lazy(() => import("../pages/recall/RecallFormPage"));

const recallRouter = (): RouteObject[] => {
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
      path: "write",
      element: (
        <Suspense fallback={Loading}>
          <Form />
        </Suspense>
      ),
    },
    {
      path: "edit/:productNo",
      element: (
        <Suspense fallback={Loading}>
          <Form />
        </Suspense>
      ),
    },
  ];
};

export default recallRouter;
