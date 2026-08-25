import type { ReactNode } from "react";
import BasicMenu from "../components/menus/BasicMenu";
import ChatbotWidget from "../components/chatbot/ChatbotWidget";
import "../styles/theme.css";

interface BasicLayoutProps {
  children: ReactNode;
  fullBleed?: boolean;
}

const BasicLayout = ({ children, fullBleed }: BasicLayoutProps) => {
  return (
    <div className={`app${fullBleed ? " app--full-bleed" : ""}`}>
      <BasicMenu />

      <div className="stage">
        <main className="main">{children}</main>
      </div>

      <ChatbotWidget />
    </div>
  );
};

export default BasicLayout;
