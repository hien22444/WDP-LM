import React from "react";
import { useSelector } from "react-redux";
import { ChatProvider } from "../../contexts/ChatContext";
import ChatManager from "../Chat/ChatManager";
import MainLayout from "./MainLayout";

const ChatLayout = () => {
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const userRole = useSelector(
    (state) => state.user.user?.role || state.user.user?.account?.role
  );

  return (
    <ChatProvider>
      <MainLayout />
      {isAuthenticated && <ChatManager />}
    </ChatProvider>
  );
};

export default ChatLayout;
