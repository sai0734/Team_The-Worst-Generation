import { lazy, Suspense } from "react";
import type { RouteObject } from "react-router-dom";

const Loading = <div>Loading....</div>;
const List = lazy(() => import("../pages/community/CommunityListPage"));
const Form = lazy(() => import("../pages/community/CommunityFormPage"));
const Detail = lazy(() => import("../pages/community/CommunityDetailPage"));

const BabysitterList = lazy(
  () => import("../pages/babysitter/BabysitterListPage"),
);
const BabysitterForm = lazy(
  () => import("../pages/babysitter/BabysitterFormPage"),
);
const BabysitterDetail = lazy(
  () => import("../pages/babysitter/BabysitterDetailPage"),
);
const BabysitterMyPicks = lazy(
  () => import("../pages/babysitter/BabysitterMyPicksPage"),
);
const BabysitterRequestsReceived = lazy(
  () => import("../pages/babysitter/BabysitterRequestsReceivedPage"),
);
const BabysitterRequestsSent = lazy(
  () => import("../pages/babysitter/BabysitterRequestsSentPage"),
);

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
    {
      path: "babysitter",
      children: [
        {
          index: true,
          element: (
            <Suspense fallback={Loading}>
              <BabysitterList />
            </Suspense>
          ),
        },
        {
          path: "me/edit",
          element: (
            <Suspense fallback={Loading}>
              <BabysitterForm />
            </Suspense>
          ),
        },
        {
          path: "my-picks",
          element: (
            <Suspense fallback={Loading}>
              <BabysitterMyPicks />
            </Suspense>
          ),
        },
        {
          path: "requests/received",
          element: (
            <Suspense fallback={Loading}>
              <BabysitterRequestsReceived />
            </Suspense>
          ),
        },
        {
          path: "requests/sent",
          element: (
            <Suspense fallback={Loading}>
              <BabysitterRequestsSent />
            </Suspense>
          ),
        },
        {
          path: ":email",
          element: (
            <Suspense fallback={Loading}>
              <BabysitterDetail />
            </Suspense>
          ),
        },
      ],
    },
  ];
};

export default communityRouter;
