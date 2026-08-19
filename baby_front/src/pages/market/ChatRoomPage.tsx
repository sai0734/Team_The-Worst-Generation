import BasicLayout from "../../layouts/BasicLayout";
import SideMenuLayout from "../../layouts/SideMenuLayout";
import { LINKS } from "../../components/market/MarketSubNav";
import ChatRoomComponent from "../../components/market/ChatRoomComponent";
import SkyBackground from "../../components/common/SkyBackground";

const ChatRoomPage = () => {
  return (
    <BasicLayout>
      <SkyBackground />
      <SideMenuLayout items={LINKS} className="page-sky-content">
        <ChatRoomComponent />
      </SideMenuLayout>
    </BasicLayout>
  );
};

export default ChatRoomPage;
