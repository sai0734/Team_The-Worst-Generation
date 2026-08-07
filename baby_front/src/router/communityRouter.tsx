import { lazy, Suspense } from "react";
import type { RouteObject } from "react-router-dom";

const Loading = <div>Loading....</div>;
const List = lazy(() => import("../pages/community/CommunityListPage"));
const Form = lazy(() => import("../pages/community/CommunityFormPage"));
const Detail = lazy(() => import("../pages/community/CommunityDetailPage"));

const communityRouter = (): RouteObject[] => {
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
      path: ":postNo/edit",
      element: (
        <Suspense fallback={Loading}>
          <Form />
        </Suspense>
      ),
    },
    {
      path: ":postNo",
      element: (
        <Suspense fallback={Loading}>
          <Detail />
        </Suspense>
      ),
    },
  ];
};

export default communityRouter;
