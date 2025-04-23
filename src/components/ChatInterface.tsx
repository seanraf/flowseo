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
  const [isLoading, setIsLoading] = useState(false); // Keep for general loading state if needed elsewhere
  const [isTyping, setIsTyping] = useState(false); // State for typing indicator
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
      const viewport = scrollAreaRef.current.querySelector<HTMLDivElement>('[data-radix-scroll-area-viewport]');
      if (viewport) {
        // Use smooth scrolling
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [messages]); // Trigger scroll on new message

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
    setIsLoading(true); // Keep general loading if needed
    setIsTyping(true); // Start typing indicator
    
    // Increment message count in parent component
    if (onSendMessage) {
      onSendMessage();
    }
    
    // Get AI response via stream
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

    // --- Robust Stream Processing Logic --- 
    let accumulatedText = '';
    let currentEventType: string | null = null;

    try {
      const stream = await runAssistantStream(threadId, content);
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          setIsTyping(false); // Stop typing when stream ends
          // Process any remaining text? Unlikely needed if stream terminates correctly.
          if (accumulatedText.trim()) {
            console.warn("Stream ended with unprocessed text:", accumulatedText);
          }
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        console.log("Raw Chunk:", chunk); // DEBUG LOG
        accumulatedText += chunk;

        // Process complete messages separated by \n\n

        let messageEndIndex;
        while ((messageEndIndex = accumulatedText.indexOf('\n\n')) !== -1) {
          const messageText = accumulatedText.substring(0, messageEndIndex);
          accumulatedText = accumulatedText.substring(messageEndIndex + 2); // Remove message + \n\n

          let eventTypeForMessage = 'message'; // Default
          let dataPayload = '';

          const lines = messageText.split('\n');
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventTypeForMessage = line.slice(6).trim();
              currentEventType = eventTypeForMessage; // Store the most recent event type
              console.log("SSE Event:", currentEventType); // DEBUG LOG
            } else if (line.startsWith('data: ')) {
              dataPayload += line.slice(5); // Append data content
            } 
            // Ignore comment lines (starting with ':') and empty lines within the message block
          }

          if (dataPayload) {
            console.log("Processing data payload for event", currentEventType, ":", dataPayload); // DEBUG LOG
            try {
              const parsedData = JSON.parse(dataPayload);
              console.log("Parsed Data:", parsedData); // DEBUG LOG

              // --- Extraction & State Update Logic ---
              let latestAiContent: string | null = null;

              if (currentEventType === 'values' && Array.isArray(parsedData?.messages)) {
                const messagesArray = parsedData.messages;
                if (messagesArray.length > 0) {
                  const lastMessage = messagesArray[messagesArray.length - 1];

                  // 1. AI message with text content
                  if (lastMessage?.type === 'ai' && typeof lastMessage.content === 'string') {
                    latestAiContent = lastMessage.content;
                    console.log("Extracted AI Content from 'values':", latestAiContent); // DEBUG LOG
                  
                  // 2. Tool message with string content (likely JSON results)
                  } else if (lastMessage?.type === 'tool' && typeof lastMessage.content === 'string') {
                    try {
                      const toolData = JSON.parse(lastMessage.content);
                      // Format keyword results nicely
                      if (Array.isArray(toolData) && toolData[0]?.keyword) {
                        const formattedKeywords = toolData.slice(0, 10).map((kw: any) => 
                          `- ${kw.keyword} (Vol: ${kw.volume}, CPC: ${kw.cpc?.toFixed(2)}, Comp: ${kw.competition})`
                        ).join('\n');
                        latestAiContent = `Keyword Research Results for "${toolData[0]?.search_question || 'query'}":\n\n${formattedKeywords}${toolData.length > 10 ? '\n...' : ''}`;
                      } else {
                        // Generic JSON formatting for other tool results
                        latestAiContent = `Tool Result:\n\`\`\`json\n${JSON.stringify(toolData, null, 2)}\n\`\`\``;
                      }
                    } catch (toolParseError) {
                      // Fallback for non-JSON tool results or parse errors
                      latestAiContent = `Tool Result (raw):\n${lastMessage.content}`;
                      console.warn("Could not parse tool result JSON:", toolParseError);
                    }
                    console.log("Extracted Tool Content from 'values':", latestAiContent); // DEBUG LOG
                  
                  // 3. AI message initiating a tool call (content is an array with functionCall)
                  } else if (lastMessage?.type === 'ai' && Array.isArray(lastMessage.content) && lastMessage.content[0]?.functionCall) {
                    const functionCall = lastMessage.content[0].functionCall;
                    latestAiContent = `*Using tool: ${functionCall.name}...*`; // Indicate tool use
                    console.log("Extracted AI Tool Call initiation:", latestAiContent); // DEBUG LOG
                  
                  // 4. Handle potential error string within tool content (like the 500 error example)
                  } else if (lastMessage?.type === 'tool' && typeof lastMessage.content === 'string' && lastMessage.content.startsWith('Error:')) {
                     latestAiContent = `*Tool Error:* ${lastMessage.content.substring(7)}`; // Display tool error
                     console.log("Extracted Tool Error Content:", latestAiContent);
                  }
                }
              } else if (currentEventType === 'metadata') {
                // Handle metadata if needed (e.g., run_id)
                console.log("Received metadata:", parsedData); // DEBUG LOG
              } else {
                 console.log(`Unhandled event type '${currentEventType}' or structure:`, parsedData); // DEBUG LOG
              }

              if (latestAiContent !== null) {
                setMessages((prevMessages) => {
                  const placeholderIndex = prevMessages.findIndex(msg => msg.id === assistantMessageId);
                  if (placeholderIndex !== -1) {
                    const updatedMessages = [...prevMessages];
                    // Always replace content when processing full messages from 'values'
                    updatedMessages[placeholderIndex] = {
                      ...updatedMessages[placeholderIndex],
                      content: latestAiContent, // Use the extracted/formatted content
                    };
                    return updatedMessages;
                  } else {
                    console.warn("Placeholder message not found for update:", assistantMessageId);
                    return prevMessages;
                  }
                });
              }
              // --- End Extraction & State Update Logic ---

            } catch (jsonParseError) {
              console.warn("Failed to parse JSON data payload:", dataPayload, jsonParseError);
            }
          }
        } // end while loop processing messages in accumulatedText
      } // end while loop reading stream
    } catch (error) {
      console.error('Error getting AI stream response:', error);
      setIsTyping(false); // Stop typing on error
      setMessages((prev) => prev.filter(msg => msg.id !== assistantMessageId)); // Remove placeholder
      toast({
        title: "Error",
        description: `Failed to get a response: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false); // Ensure general loading stops
      // isTyping is handled in `done` and `catch`
    }
    // --- End Robust Stream Processing Logic --- 
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
      
      <ChatInput 
        onSendMessage={handleSendMessage}
        // Pass isTyping instead of isLoading to disable input while agent is responding
        isLoading={isTyping} 
      />
    </div>
  );
};

export default ChatInterface;
