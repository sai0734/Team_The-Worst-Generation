import BasicLayout from "../../layouts/BasicLayout";
import MarketSubNav from "../../components/market/MarketSubNav";
import ChatRoomListComponent from "../../components/market/ChatRoomListComponent";

const ChatRoomListPage = () => {
  return (
    <BasicLayout>
      <div>
        <MarketSubNav />
        <ChatRoomListComponent />
      </div>
    </BasicLayout>
  );
};

export default ChatRoomListPage;
