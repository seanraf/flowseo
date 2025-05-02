
import React, { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import MessageItem, { Message } from './MessageItem';
import { PricingModal } from './PricingModal';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ChatMessageListProps {
  messages: Message[];
  isTyping: boolean;
  messageLimitReached: boolean;
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({ 
  messages, 
  isTyping, 
  messageLimitReached 
}) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // --- Helper function for scrolling ---
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector<HTMLDivElement>('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }
    }
  };

  // Effect to scroll down when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]); // Trigger scroll on new message

  return (
    <ScrollArea className="flex-1 chat-pattern" ref={scrollAreaRef as any}>
      <div className="pb-20" data-radix-scroll-area-viewport="">
        {messages.map((message, index) => (
          <MessageItem
            key={message.id}
            message={message}
            isLast={index === messages.length - 1}
          />
        ))}
        
        {/* Typing Indicator */} 
        {isTyping && (
          <div className="px-4 py-6 sm:px-6">
            <div className="mx-auto flex max-w-3xl gap-4 sm:gap-6">
              <div className="relative mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-primary/10 text-primary border-primary/20">
                <span className="animate-pulse">...</span> 
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-1/3 rounded bg-muted animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        {messageLimitReached && (
          <div className="mx-auto max-w-2xl p-4 mt-6 bg-muted/30 rounded-lg border border-border">
            <div className="text-center space-y-4">
              <h3 className="text-base font-medium">You've reached the free plan limit</h3>
              <p className="text-sm text-muted-foreground">
                Upgrade to continue using FlowSEO with unlimited messages and multiple projects.
              </p>
              <PricingModal>
                <Button variant="default">Upgrade Now</Button>
              </PricingModal>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default ChatMessageList;
