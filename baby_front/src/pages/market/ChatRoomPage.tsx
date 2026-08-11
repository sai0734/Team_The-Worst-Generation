import BasicLayout from "../../layouts/BasicLayout";
import MarketSubNav from "../../components/market/MarketSubNav";
import ChatRoomComponent from "../../components/market/ChatRoomComponent";

const ChatRoomPage = () => {
  return (
    <BasicLayout>
      <MarketSubNav />
      <ChatRoomComponent />
    </BasicLayout>
  );
};

export default ChatRoomPage;
