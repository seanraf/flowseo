
import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Bot, User, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface MessageItemProps {
  message: Message;
  isLast: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isLast }) => {
  const { toast } = useToast();
  const messageRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = React.useState(false);

  const isUser = message.role === 'user';
  
  useEffect(() => {
    if (isLast && messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isLast]);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setIsCopied(true);
    toast({
      description: "Message copied to clipboard",
      duration: 2000,
    });
    
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <div 
      ref={messageRef}
      className={cn(
        "group px-4 py-6 sm:px-6 transition-colors",
        isUser ? "bg-background" : "bg-muted/30",
        isLast && "animate-slide-in"
      )}
    >
      <div className="mx-auto flex max-w-3xl gap-4 sm:gap-6">
        <div className={cn(
          "relative mt-1 flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow-sm",
          isUser 
            ? "bg-background text-foreground" 
            : "bg-primary/10 text-primary border-primary/20"
        )}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>
        
        <div className="min-w-0 flex-1 space-y-2">
          <div className="prose prose-sm break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0">
            {message.content.split('\n').map((line, i) => (
              <p key={i}>{line || '\u00A0'}</p>
            ))}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
            
            {!isUser && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                onClick={copyToClipboard}
              >
                {isCopied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
