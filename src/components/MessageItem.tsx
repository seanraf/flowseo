import React, { useRef } from 'react'; // Removed useEffect
import { cn } from '@/lib/utils';
import { Bot, User, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
// Import react-markdown and the GFM plugin
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isError?: boolean; // Optional flag for error messages
}

interface MessageItemProps {
  message: Message;
  isLast: boolean; // Keep isLast if needed for animations or other logic, but not scrolling
}

// Use React.memo for performance optimization
const MessageItem: React.FC<MessageItemProps> = React.memo(({ message, isLast }) => {
  // Destructure props for cleaner access
  const { role, content, timestamp, isError } = message;
  const { toast } = useToast();
  const messageRef = useRef<HTMLDivElement>(null); // Keep ref if needed for other purposes, e.g., animations
  const [isCopied, setIsCopied] = React.useState(false);

  const isUser = role === 'user';

  // Removed useEffect for scrolling, as parent ChatInterface handles it

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    toast({
      description: "Message copied to clipboard",
      duration: 2000,
    });
    
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  // Removed custom renderContent function

  return (
    <div
      ref={messageRef} // Keep ref if needed for other potential uses (e.g., focus management, animations)
      className={cn(
        "group px-4 py-6 sm:px-6 transition-colors",
        isUser ? "bg-background" : "bg-muted/30",
        isError && !isUser ? "bg-destructive/10" : "",
        // isLast && "animate-slide-in" // Keep animation if desired
      )}
    >
      <div className="mx-auto flex max-w-3xl gap-4 sm:gap-6">
        <div className={cn(
          "relative mt-1 flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow-sm",
          isUser
            ? "bg-background text-foreground"
            : isError
              ? "bg-destructive/20 text-destructive border-destructive/30"
              : "bg-primary/10 text-primary border-primary/20"
        )}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          {/* Use ReactMarkdown for rendering content */}
          <div className={cn(
            "prose prose-sm break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0",
            // Prose classes should style most markdown elements correctly
            isError && "text-destructive prose-strong:text-destructive prose-em:text-destructive" // Ensure error text color overrides prose styles
          )}>
            {/* Render content using ReactMarkdown with GFM support */}
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {new Date(timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>

            {!isUser && !isError && ( // Also hide copy button for error messages
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                onClick={copyToClipboard}
                aria-label="Copy message" // Add aria-label for accessibility
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
}); // Wrap component with React.memo

export default MessageItem;
