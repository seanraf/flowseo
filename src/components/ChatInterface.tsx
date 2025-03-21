
import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import MessageItem, { Message } from './MessageItem';
import ChatInput from './ChatInput';

interface ChatInterfaceProps {
  activeConversationId: string | null;
}

// Initial welcome message
const welcomeMessage: Message = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi there! I'm ChatSEO, your AI assistant for SEO research, keyword selection, and content generation. How can I help you today?",
  timestamp: new Date(),
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ activeConversationId }) => {
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [isLoading, setIsLoading] = useState(false);

  // Reset messages when conversation changes
  useEffect(() => {
    if (activeConversationId) {
      // In a real app, we would fetch messages for this conversation
      // For now, we'll just reset to the welcome message
      setMessages([welcomeMessage]);
    }
  }, [activeConversationId]);

  const handleSendMessage = async (content: string) => {
    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    
    // Add user message to chat
    setMessages((prev) => [...prev, userMessage]);
    
    // Simulate AI response
    setIsLoading(true);
    
    try {
      // In a real app, we would call the OpenAI API here
      // For demo purposes, we'll simulate a delay and a fixed response
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I'll help you research and analyze "${content}" from an SEO perspective. This would be where the AI response with keyword information and content suggestions would appear.`,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <ScrollArea className="flex-1 chat-pattern">
        <div className="pb-20">
          {messages.map((message, index) => (
            <MessageItem
              key={message.id}
              message={message}
              isLast={index === messages.length - 1}
            />
          ))}
          
          {isLoading && (
            <div className="px-4 py-6 sm:px-6">
              <div className="mx-auto flex max-w-3xl gap-4 sm:gap-6">
                <div className="relative mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-primary/10 text-primary border-primary/20">
                  <span className="animate-pulse-subtle">•••</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="h-5 w-1/3 rounded bg-muted animate-pulse"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <ChatInput 
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ChatInterface;
