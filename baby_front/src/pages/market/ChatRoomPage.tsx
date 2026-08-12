import BasicLayout from "../../layouts/BasicLayout";
import MarketSubNav from "../../components/market/MarketSubNav";
import ChatRoomComponent from "../../components/market/ChatRoomComponent";

const ChatRoomPage = () => {
  return (
    <BasicLayout>
      <div>
        <MarketSubNav />
        <ChatRoomComponent />
      </div>
    </BasicLayout>
  );
};

export default ChatRoomPage;
