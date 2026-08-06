import { Suspense, lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import todoRouter from "./todoRouter";
import productsRouter from "./productsRouter";
import memberRouter from "./memberRouter";
import babyInfoRouter from "./babyInfoRouter";

const Loading = <div>Loading....</div>;
const Main = lazy(() => import("../pages/MainPage"));
const About = lazy(() => import("../pages/AboutPage"));
const TodoIndex = lazy(() => import("../pages/todo/IndexPage"));
const ProductsRouter = lazy(() => import("../pages/products/IndexPage"));
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
    path: "/todo",
    element: (
      <Suspense fallback={Loading}>
        <TodoIndex />
      </Suspense>
    ),
    children: todoRouter(),
  },
  {
    path: "products",
    element: (
      <Suspense fallback={Loading}>
        <ProductsRouter />
      </Suspense>
    ),
    children: productsRouter(),
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
]);

export default root;
