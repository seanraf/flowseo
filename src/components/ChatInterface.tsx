
import React, { useEffect } from 'react';
import ChatInput from './ChatInput';
import ChatMessageList from './ChatMessageList';
import ChatHeader from './ChatHeader';
import { useStreamingAssistant } from '@/hooks/useStreamingAssistant';
import { Message } from './MessageItem';

interface ChatInterfaceProps {
  activeConversationId: string | null;
  isUnlimitedMode?: boolean;
  onSendMessage?: () => void;
  messageCount?: number;
  messageLimitReached?: boolean;
}

// Initial welcome message
const welcomeMessage: Message = {
  id: 'welcome',
  role: 'assistant',
  content: "Welcome to FlowSEO! I'm your AI assistant for SEO research, keyword selection, and content generation. You can ask me to:\n\n- Research keywords for any topic\n- Generate SEO-optimized content\n- Create meta tags and descriptions\n- Provide general SEO advice and insights\n\nHow can I help you today?",
  timestamp: new Date(),
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  activeConversationId, 
  isUnlimitedMode = false, 
  onSendMessage,
  messageCount = 0,
  messageLimitReached = false,
}) => {
  const {
    messages,
    setMessages,
    isLoading,
    isTyping,
    initializeThread,
    sendMessage
  } = useStreamingAssistant({
    onSendMessage,
    messageLimitReached
  });

  // Effect to create a thread when the component mounts or conversation changes
  useEffect(() => {
    if (activeConversationId) {
      initializeThread(activeConversationId, welcomeMessage);
    } else {
      // Handle case where there's no active conversation (e.g., clear state)
      setMessages([welcomeMessage]);
    }
  }, [activeConversationId, initializeThread, setMessages]);

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <ChatHeader 
        isUnlimitedMode={isUnlimitedMode} 
        messageCount={messageCount} 
      />
      
      <ChatMessageList 
        messages={messages}
        isTyping={isTyping}
        messageLimitReached={messageLimitReached}
      />
      
      <ChatInput 
        onSendMessage={handleSendMessage}
        isLoading={isTyping} 
      />
    </div>
  );
};

export default ChatInterface;
