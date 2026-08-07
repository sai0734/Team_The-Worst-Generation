import { Suspense, lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import memberRouter from "./memberRouter";
import babyInfoRouter from "./babyInfoRouter";
import babysitterRouter from "./babysitterRouter";
import communityRouter from "./communityRouter";

const Loading = <div>Loading....</div>;
const Main = lazy(() => import("../pages/MainPage"));
const About = lazy(() => import("../pages/AboutPage"));
const BabyInfoIndex = lazy(() => import("../pages/babyInfo/BabyInfoIndexPage"));

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
    path: "babysitter",
    children: babysitterRouter(),
  },
  {
    path: "community",
    children: communityRouter(),
  },
]);

export default root;
