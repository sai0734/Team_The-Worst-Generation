import { Suspense, lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import memberRouter from "./memberRouter";
import babyInfoRouter from "./babyInfoRouter";
import diaryRouter from "./diaryRouter";
import communityRouter from "./communityRouter";
import marketRouter from "./marketRouter";
import recallRouter from "./recallRouter";
import ledgerRouter from "./ledgerRouter";
import allergyRouter from "./allergyRouter";
import cryCheckRouter from "./cryCheckRouter";
import MyPage from "../pages/member/MyPage";
import hospitalRouter from "./hospitalRouter";

const Loading = <div>Loading....</div>;
const Main = lazy(() => import("../pages/MainPage"));
const Dashboard = lazy(() => import("../pages/DashboardPage"));
const MainOnly = lazy(() => import("../pages/landing/MainOnlyPage"));
const About = lazy(() => import("../pages/AboutPage"));
const BabyInfoIndex = lazy(() => import("../pages/babyInfo/BabyInfoIndexPage"));
const DiaryIndex = lazy(() => import("../pages/diary/DiaryIndexPage"));
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
    path: "/main",
    element: (
      <Suspense fallback={Loading}>
        <MainOnly />
      </Suspense>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <Suspense fallback={Loading}>
        <Dashboard />
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
    path: "/mypage",
    element: (
      <Suspense fallback={Loading}>
        <MyPage />
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
    element: (
      <Suspense fallback={Loading}>
        <DiaryIndex />
      </Suspense>
    ),
    children: diaryRouter(),
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
    path: "hospital",
    children: hospitalRouter(),
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
  {
    path: "ai",
    children: cryCheckRouter(),
  },
]);

export default root;
