import { Suspense, lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import memberRouter from "./memberRouter";
import babyInfoRouter from "./babyInfoRouter";
import diaryRouter from "./diaryRouter";
import albumRouter from "./albumRouter";
import communityRouter from "./communityRouter";
import marketRouter from "./marketRouter";
import recallRouter from "./recallRouter";

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
    path: "diary",
    children: diaryRouter(),
  },
  {
    path: "album",
    children: albumRouter(),
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
]);

export default root;
