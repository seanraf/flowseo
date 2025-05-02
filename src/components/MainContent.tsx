
import React, { useState } from 'react';
import Header from '@/components/Header';
import ChatInterface from '@/components/ChatInterface';

interface MainContentProps {
  toggleSidebar: () => void;
  activeConversationTitle: string | null;
  activeConversationId: string;
  isUnlimitedUser: boolean;
  messageLimitReached: boolean;
  messageCount: number;
  incrementMessageCount: () => void;
}

const MainContent: React.FC<MainContentProps> = ({
  toggleSidebar,
  activeConversationTitle,
  activeConversationId,
  isUnlimitedUser,
  messageLimitReached,
  messageCount,
  incrementMessageCount
}) => {
  return (
    <div className="flex flex-1 flex-col md:ml-[280px]">
      <Header 
        toggleSidebar={toggleSidebar} 
        activeConversationTitle={activeConversationTitle} 
      />
      <main className="flex-1 overflow-hidden">
        <ChatInterface 
          activeConversationId={activeConversationId} 
          isUnlimitedMode={isUnlimitedUser}
          onSendMessage={incrementMessageCount}
          messageCount={messageCount}
          messageLimitReached={messageLimitReached}
        />
      </main>
    </div>
  );
};

export default MainContent;
