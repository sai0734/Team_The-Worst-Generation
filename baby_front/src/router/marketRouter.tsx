import { Suspense, lazy } from "react";
import type { RouteObject } from "react-router-dom";

const Loading = <div>Loading....</div>;
const List = lazy(() => import("../pages/market/MarketListPage"));
const Form = lazy(() => import("../pages/market/MarketFormPage"));
const Detail = lazy(() => import("../pages/market/MarketDetailPage"));
const Wish = lazy(() => import("../pages/market/MarketWishPage"));
const MyPage = lazy(() => import("../pages/market/MarketMyPage"));
const Profile = lazy(() => import("../pages/market/MarketProfilePage"));
const ChatRoomList = lazy(() => import("../pages/market/ChatRoomListPage"));
const ChatRoom = lazy(() => import("../pages/market/ChatRoomPage"));

const marketRouter = (): RouteObject[] => {
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
      path: ":itemNo/edit",
      element: (
        <Suspense fallback={Loading}>
          <Form />
        </Suspense>
      ),
    },
    {
      path: "wish",
      element: (
        <Suspense fallback={Loading}>
          <Wish />
        </Suspense>
      ),
    },
    {
      path: "mypage",
      element: (
        <Suspense fallback={Loading}>
          <MyPage />
        </Suspense>
      ),
    },
    {
      path: "profile/:email",
      element: (
        <Suspense fallback={Loading}>
          <Profile />
        </Suspense>
      ),
    },
    {
      path: "chat",
      element: (
        <Suspense fallback={Loading}>
          <ChatRoomList />
        </Suspense>
      ),
    },
    {
      path: "chat/:roomNo",
      element: (
        <Suspense fallback={Loading}>
          <ChatRoom />
        </Suspense>
      ),
    },
    {
      path: ":itemNo",
      element: (
        <Suspense fallback={Loading}>
          <Detail />
        </Suspense>
      ),
    },
  ];
};

export default marketRouter;
