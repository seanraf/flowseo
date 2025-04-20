import React, { useState, useEffect, useRef } from 'react'; // Added useRef
import { ScrollArea } from '@/components/ui/scroll-area';
import MessageItem, { Message } from './MessageItem';
import ChatInput from './ChatInput';
// Import new LangGraph service functions
import { createThread, runAssistantStream, getHistory } from '@/services/langGraphService'; 
import { useToast } from '@/components/ui/use-toast';
import { PricingModal } from './PricingModal';
import { Button } from '@/components/ui/button';

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
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null); // State for thread ID
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null); // Ref for scrolling

  // Effect to create a thread when the component mounts or conversation changes
  useEffect(() => {
    const initializeThread = async () => {
      setIsLoading(true);
      console.log("Initializing thread for activeConversationId:", activeConversationId); // ADDED LOG
      try {
        // Attempt to retrieve threadId from sessionStorage first
        const storedThreadId = sessionStorage.getItem(`threadId_${activeConversationId}`);
        console.log("Stored threadId:", storedThreadId); // ADDED LOG
        if (storedThreadId) {
          setThreadId(storedThreadId);
          // Optionally load history here if needed
          // const history = await getHistory(storedThreadId);
          // setMessages(processHistory(history)); // Need a function to format history
          setMessages([welcomeMessage]); // Resetting for now
        } else {
          console.log("Creating a new thread..."); // ADDED LOG
          const newThreadId = await createThread();
          console.log("New threadId created:", newThreadId); // ADDED LOG
          setThreadId(newThreadId);
          sessionStorage.setItem(`threadId_${activeConversationId}`, newThreadId); // Store threadId
          setMessages([welcomeMessage]); // Start with welcome message for new thread
        }
      } catch (error) {
        console.error("Error initializing thread:", error);
        toast({
          title: "Error",
          description: "Failed to initialize chat session. Please refresh.",
          variant: "destructive",
        });
        setMessages([welcomeMessage]); // Show welcome message even on error
      } finally {
        setIsLoading(false);
      }
    };

    if (activeConversationId) {
      initializeThread();
    } else {
      // Handle case where there's no active conversation (e.g., clear state)
      setThreadId(null);
      setMessages([welcomeMessage]);
    }
    // Clean up sessionStorage if component unmounts or conversation changes drastically
    // return () => { sessionStorage.removeItem(`threadId_${activeConversationId}`); }; 
  }, [activeConversationId, toast]);

  // Effect to scroll down when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    // Check if user has reached message limit
    if (messageLimitReached) {
      toast({
        title: "Message Limit Reached",
        description: "You've reached the free plan limit of 10 messages. Please upgrade to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!threadId) {
      toast({
        title: "Error",
        description: "Chat session not initialized. Please wait or refresh.",
        variant: "destructive",
      });
      return;
    }
    
    // Create user message
    const userMessage: Message = {
      id: `user-${Date.now()}`, // More specific ID
      role: 'user',
      content,
      timestamp: new Date(),
    };
    
    // Add user message to chat
    setMessages((prev) => [...prev, userMessage]);
    
    // Increment message count in parent component
    if (onSendMessage) {
      onSendMessage();
    }
    
    // Get AI response via stream
    setIsLoading(true);
    const assistantMessageId = `assistant-${Date.now()}`;
    // Add a placeholder for the assistant message
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '', // Start with empty content
        timestamp: new Date(),
      },
    ]);

    try {
      const stream = await runAssistantStream(threadId, content);
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let streamedContent = '';

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        
        // Assuming the stream provides JSON chunks like { "event": "...", "data": ... }
        // Adjust parsing based on actual stream format from LangGraph
        try {
            // Split potential multiple JSON objects in a single chunk
            const jsonObjects = chunk.match(/\{.*?\}\s*/g);
            if (jsonObjects) {
                jsonObjects.forEach(jsonString => {
                    if (jsonString.trim()) {
                        const parsed = JSON.parse(jsonString.trim());
                        // Look for the actual message content within the streamed data
                        // This structure depends heavily on how LangGraph Cloud streams responses.
                        // Common patterns include checking event types ('on_chat_model_stream', 'on_tool_end', etc.)
                        // and extracting content from 'data.chunk.content' or similar paths.
                        // --- START EXAMPLE PARSING LOGIC (NEEDS ADJUSTMENT) ---
                        if (parsed.event === 'on_chat_model_stream' && parsed.data?.chunk?.content) {
                            streamedContent += parsed.data.chunk.content;
                        } else if (parsed.event === 'on_llm_end' && parsed.data?.output?.content) {
                             // Sometimes final output comes in a different event
                             // streamedContent = parsed.data.output.content; // Overwrite if needed
                        }
                        // --- END EXAMPLE PARSING LOGIC ---

                        // Update the last message (assistant's placeholder) with new content
                        setMessages((prev) =>
                          prev.map((msg) =>
                            msg.id === assistantMessageId
                              ? { ...msg, content: streamedContent }
                              : msg
                          )
                        );
                    }
                });
            }
        } catch (parseError) {
          console.warn("Failed to parse stream chunk:", chunk, parseError);
          // Fallback: Append raw chunk if JSON parsing fails? Or handle specific error types.
          // streamedContent += chunk; // Less ideal, might show raw JSON
        }
      }

      // Final update in case the last chunk didn't trigger an update
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: streamedContent || "..." } // Use ellipsis if empty
            : msg
        )
      );

    } catch (error) {
      console.error('Error getting AI stream response:', error);
      // Remove the placeholder message on error
      setMessages((prev) => prev.filter(msg => msg.id !== assistantMessageId));
      toast({
        title: "Error",
        description: `Failed to get a response: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {!isUnlimitedMode && (
        <div className="bg-muted/50 px-4 py-2 border-b flex justify-between items-center">
          <div className="text-sm">
            <span className="font-semibold">{messageCount}</span> of <span className="font-semibold">10</span> free messages used
          </div>
          <div className="flex items-center gap-2">
            <PricingModal>
              <Button variant="default">Upgrade Now</Button>
            </PricingModal>
          </div>
        </div>
      )}
      
      {/* Add ref to ScrollArea's child div if ScrollArea doesn't forward ref directly */}
      <ScrollArea className="flex-1 chat-pattern" ref={scrollAreaRef as any}> 
        <div className="pb-20" data-radix-scroll-area-viewport=""> {/* Ensure viewport exists */}
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
                <div className="min-w-0 flex-1 space-y-2">
                  {/* Simulate streaming appearance */}
                  <div className="h-4 w-1/3 rounded bg-muted animate-pulse"></div>
                  <div className="h-4 w-2/3 rounded bg-muted animate-pulse"></div>
                  <div className="h-4 w-1/2 rounded bg-muted animate-pulse"></div>
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
      
      <ChatInput 
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ChatInterface;
