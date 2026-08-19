import BasicLayout from "../../layouts/BasicLayout";
import SideMenuLayout from "../../layouts/SideMenuLayout";
import { LINKS } from "../../components/market/MarketSubNav";
import ChatRoomListComponent from "../../components/market/ChatRoomListComponent";
import SkyBackground from "../../components/common/SkyBackground";

const ChatRoomListPage = () => {
  return (
    <BasicLayout>
      <SkyBackground />
      <SideMenuLayout items={LINKS} className="page-sky-content">
        <ChatRoomListComponent />
      </SideMenuLayout>
    </BasicLayout>
  );
};

export default ChatRoomListPage;
