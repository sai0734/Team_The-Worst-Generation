import BasicLayout from "../../layouts/BasicLayout";
import ChatRoomComponent from "../../components/market/ChatRoomComponent";
import SkyBackground from "../../components/common/SkyBackground";

const ChatRoomPage = () => {
  return (
    <BasicLayout>
      <SkyBackground />
      <div className="page-sky-content">
        <ChatRoomComponent />
      </div>
    </BasicLayout>
  );
};

export default ChatRoomPage;
