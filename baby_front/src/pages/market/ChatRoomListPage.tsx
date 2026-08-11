import BasicLayout from "../../layouts/BasicLayout";
import MarketSubNav from "../../components/market/MarketSubNav";
import ChatRoomListComponent from "../../components/market/ChatRoomListComponent";

const ChatRoomListPage = () => {
  return (
    <BasicLayout>
      <MarketSubNav />
      <ChatRoomListComponent />
    </BasicLayout>
  );
};

export default ChatRoomListPage;
