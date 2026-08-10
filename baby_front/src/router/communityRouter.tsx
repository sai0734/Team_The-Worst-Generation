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
const BabysitterJobList = lazy(
  () => import("../pages/babysitter/BabysitterJobListPage"),
);
const BabysitterJobForm = lazy(
  () => import("../pages/babysitter/BabysitterJobFormPage"),
);
const BabysitterJobDetail = lazy(
  () => import("../pages/babysitter/BabysitterJobDetailPage"),
);
const BabysitterMyJobPosts = lazy(
  () => import("../pages/babysitter/BabysitterMyJobPostsPage"),
);
const BabysitterMyApplications = lazy(
  () => import("../pages/babysitter/BabysitterMyApplicationsPage"),
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
          path: "jobs",
          children: [
            {
              index: true,
              element: (
                <Suspense fallback={Loading}>
                  <BabysitterJobList />
                </Suspense>
              ),
            },
            {
              path: "write",
              element: (
                <Suspense fallback={Loading}>
                  <BabysitterJobForm />
                </Suspense>
              ),
            },
            {
              path: "mine",
              element: (
                <Suspense fallback={Loading}>
                  <BabysitterMyJobPosts />
                </Suspense>
              ),
            },
            {
              path: "applications/mine",
              element: (
                <Suspense fallback={Loading}>
                  <BabysitterMyApplications />
                </Suspense>
              ),
            },
            {
              path: ":jobNo",
              element: (
                <Suspense fallback={Loading}>
                  <BabysitterJobDetail />
                </Suspense>
              ),
            },
          ],
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
