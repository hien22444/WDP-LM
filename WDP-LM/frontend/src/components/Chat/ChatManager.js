import React from 'react';
import { useChat } from '../../contexts/ChatContext';
import ChatWidget from './ChatWidget';

const ChatManager = () => {
  const { activeChats, closeChat, minimizeChat, maximizeChat } = useChat();

  return (
    <>
      {activeChats.map((chat, index) => (
        <ChatWidget
          key={chat.id}
          tutor={chat.tutor}
          isOpen={true}
          onClose={() => closeChat(chat.id)}
          isMinimized={chat.isMinimized}
          onMinimize={() => minimizeChat(chat.id)}
          onMaximize={() => maximizeChat(chat.id)}
          style={{
            bottom: `${20 + (index * 60)}px`,
            right: '20px'
          }}
        />
      ))}
    </>
  );
};

export default ChatManager;
