import { Suspense, lazy } from "react";
import type { RouteObject } from "react-router-dom";

const Loading = <div>Loading....</div>;
const List = lazy(() => import("../pages/market/MarketListPage"));
const MyItems = lazy(() => import("../pages/market/MarketMyItemsPage"));
const Form = lazy(() => import("../pages/market/MarketFormPage"));
const Detail = lazy(() => import("../pages/market/MarketDetailPage"));
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
      path: "my-items",
      element: (
        <Suspense fallback={Loading}>
          <MyItems />
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
