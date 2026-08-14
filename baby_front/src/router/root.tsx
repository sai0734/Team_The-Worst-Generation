import { Suspense, lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import memberRouter from "./memberRouter";
import babyInfoRouter from "./babyInfoRouter";
import communityRouter from "./communityRouter";
import marketRouter from "./marketRouter";
import recallRouter from "./recallRouter";
import ledgerRouter from "./ledgerRouter";
import allergyRouter from "./allergyRouter";

const Loading = <div>Loading....</div>;
const Main = lazy(() => import("../pages/MainPage"));
const About = lazy(() => import("../pages/AboutPage"));
const BabyInfoIndex = lazy(() => import("../pages/babyInfo/BabyInfoIndexPage"));
const CommunityIndex = lazy(
  () => import("../pages/community/CommunityIndexPage"),
);

const root = createBrowserRouter([
  {
    path: "/",
    element: (
      <Suspense fallback={Loading}>
        <Main />
      </Suspense>
    ),
  },
  {
    path: "/about",
    element: (
      <Suspense fallback={Loading}>
        <About />
      </Suspense>
    ),
  },
  {
    path: "member",
    children: memberRouter(),
  },
  {
    path: "babyInfo",
    element: (
      <Suspense fallback={Loading}>
        <BabyInfoIndex />
      </Suspense>
    ),
    children: babyInfoRouter(),
  },
  {
    path: "community",
    element: (
      <Suspense fallback={Loading}>
        <CommunityIndex />
      </Suspense>
    ),
    children: communityRouter(),
  },
  {
    path: "market",
    children: marketRouter(),
  },
  {
    path: "recall",
    children: recallRouter(),
  },
  {
    path: "ledger",
    children: ledgerRouter(),
  },
  {
    path: "allergy",
    children: allergyRouter(),
  },
]);

export default root;
