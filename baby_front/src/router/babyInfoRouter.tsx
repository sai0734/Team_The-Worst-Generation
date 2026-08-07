import { lazy, Suspense } from "react";
import { RouteObject } from "react-router-dom";

const Loading = <div>Loading....</div>;
const Input = lazy(() => import("../pages/babyInfo/BabyInfoInputPage"));
const Dashboard = lazy(() => import("../pages/babyInfo/BabyInfoPage"));

const babyInfoRouter = (): RouteObject[] => {
  return [
    {
      path: "dashboard/:babyNo",
      element: (
        <Suspense fallback={Loading}>
          <Dashboard />
        </Suspense>
      ),
    },
    {
      path: "input",
      element: (
        <Suspense fallback={Loading}>
          <Input />
        </Suspense>
      ),
    },
  ];
};

export default babyInfoRouter;
