import BasicLayout from "../../layouts/BasicLayout";
import ChatRoomListComponent from "../../components/market/ChatRoomListComponent";
import SkyBackground from "../../components/common/SkyBackground";

const ChatRoomListPage = () => {
  return (
    <BasicLayout>
      <SkyBackground />
      <div className="page-sky-content">
        <ChatRoomListComponent />
      </div>
    </BasicLayout>
  );
};

export default ChatRoomListPage;
