import type { ReactNode } from "react";
import BasicMenu from "../components/menus/BasicMenu";
import ChatbotWidget from "../components/chatbot/ChatbotWidget";
import { WIPE_ELEMENT_ID } from "../utils/pageTransition";
import "../styles/theme.css";

interface BasicLayoutProps {
  children: ReactNode;
  fullBleed?: boolean;
}

const BasicLayout = ({ children, fullBleed }: BasicLayoutProps) => {
  return (
    <div className={`app${fullBleed ? " app--full-bleed" : ""}`}>
      <div id={WIPE_ELEMENT_ID} className="page-wipe">
        <span className="page-wipe-label">아이봄</span>
      </div>

      <BasicMenu />

      <div className="stage">
        <main className="main">{children}</main>
      </div>

      <ChatbotWidget />
    </div>
  );
};

export default BasicLayout;
