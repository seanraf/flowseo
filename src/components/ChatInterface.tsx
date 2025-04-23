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
  const bufferRef = useRef(""); // Buffer to hold incomplete chunks
  const assistantMessageIdRef = useRef<string | null>(null); // Ref to hold the current assistant message ID

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

  // --- Refined Stream Handling Logic ---
  // Added optional finalAssistantId parameter for the final flush
  const handleIncomingChunk = (chunk: string, finalAssistantId: string | null = null) => {
    bufferRef.current += chunk;
    // console.log("Chunk Received:", chunk); // DEBUG -> Removed
    // console.log("Buffer Before Processing:", bufferRef.current); // DEBUG -> Removed

    const eventDelimiter = '\n\n';
    let eventEnd = bufferRef.current.indexOf(eventDelimiter);

    while (eventEnd !== -1) {
      // Extract the string containing one or more events up to the delimiter
      const rawEventsBlock = bufferRef.current.slice(0, eventEnd).trim();
      // Remove the processed block and delimiter from the buffer
      bufferRef.current = bufferRef.current.slice(eventEnd + eventDelimiter.length);
      // console.log("Processing Events Block:", rawEventsBlock); // DEBUG -> Removed
      // console.log("Buffer After Slice:", bufferRef.current); // DEBUG -> Removed

      if (!rawEventsBlock) { // Skip if the extracted part is empty
          eventEnd = bufferRef.current.indexOf(eventDelimiter); // Find next delimiter
          continue;
      }

      // --- START: Split rawEventsBlock into individual events ---
      // Use positive lookahead to split before "event:", keeping the delimiter
      const subEvents = rawEventsBlock.split(/(?=event:)/);

      subEvents.forEach(subEventString => {
        if (!subEventString.trim()) return; // Skip empty strings resulting from split

        const lines = subEventString.trim().split('\n');
        let eventType = '';
        let data = ''; // Reset data for each sub-event

        lines.forEach(line => {
          if (line.startsWith('event:')) {
            eventType = line.replace('event:', '').trim();
          } else if (line.startsWith('data:')) {
            // Append the content after 'data: ', handling multi-line data correctly
            data += line.substring(5); // Don't trim here
          }
        });

        if (eventType && data) {
          // console.log(`Found Sub-Event: ${eventType}, Data: ${data}`); // DEBUG -> Removed
          try {
            const parsedData = JSON.parse(data);
            switch (eventType) {
              case "metadata":
                // console.log("Received metadata:", parsedData); // DEBUG -> Removed
                if (!isTyping) setIsTyping(true);
                break;
              case "values":
                // Pass the finalAssistantId if available
                processValuesEvent(parsedData, finalAssistantId); 
                break;
              default:
                console.warn(`Unhandled event type: ${eventType}`);
            }
          } catch (e) {
            // Log the error and the specific data that caused it
            console.error("JSON parsing failed for sub-event:", e, { eventType, data });
          }
        } else {
            console.warn("Skipping sub-event part without valid event/data:", subEventString);
        }
      });
      // --- END: Split rawEventsBlock into individual events ---

      // Find the next event delimiter in the potentially modified buffer
      eventEnd = bufferRef.current.indexOf(eventDelimiter);
    }
    // console.log("Buffer After Loop:", bufferRef.current); // DEBUG -> Removed
  };

  const handleStreamEnd = () => {
    // Capture the ID *before* potentially clearing the ref or flushing
    const finalAssistantId = assistantMessageIdRef.current; 
    
    if (bufferRef.current.trim()) {
      console.warn("Final buffer content (attempting final parse):", bufferRef.current);
      // Force processing of any leftover content by adding a delimiter
      // Pass the captured ID for this final processing step
      handleIncomingChunk("\n\n", finalAssistantId); 
    }
    
    // Ensure buffer is cleared *after* final processing attempt
    bufferRef.current = ""; 
    setIsTyping(false); // Ensure typing stops
    
    // Clear the ref as the very last step
    assistantMessageIdRef.current = null; 
    console.log("Stream end processed, buffer cleared, typing stopped.");
  };
  // --- End Refined Stream Handling Logic ---

  // --- Helper function to process 'values' events ---
  // Added optional finalAssistantId parameter
  const processValuesEvent = (data: any, finalAssistantId: string | null = null) => {
    // The 'values' event seems to contain the whole history.
    // Find the latest AI message in the received chunk.
    const latestAiMessage = data?.messages?.filter((m: any) => m.type === 'ai').pop();
    
    // Use the finalAssistantId if provided (from handleStreamEnd), otherwise use the ref
    const targetAssistantId = finalAssistantId ?? assistantMessageIdRef.current;

    if (latestAiMessage && targetAssistantId) {
      setMessages((prevMessages) => {
        const messageIndex = prevMessages.findIndex(msg => msg.id === targetAssistantId);
        if (messageIndex !== -1) {
          const updatedMessages = [...prevMessages];
          // Update the content of the existing placeholder/message with the full content from the stream
          updatedMessages[messageIndex] = {
            ...updatedMessages[messageIndex],
            content: latestAiMessage.content || '', // Use the full content
            // Update other relevant fields if necessary from latestAiMessage
            // e.g., response_metadata, tool_calls if they exist and are needed
          };
          // Ensure we scroll down as content updates
          // Debounce or throttle this if performance becomes an issue
          requestAnimationFrame(scrollToBottom); 
          return updatedMessages;
        } else {
          // This warning might still appear if the placeholder wasn't created correctly initially
          console.warn("Assistant message placeholder not found for ID:", targetAssistantId); 
          return prevMessages;
        }
      });
    } else if (!targetAssistantId) {
        // This condition should be less likely now with the finalAssistantId logic
        console.warn("Received 'values' event but no target assistant message ID is available.");
    } else if (!latestAiMessage) {
        // This might happen if the 'values' event doesn't contain an AI message yet or has an unexpected structure
        // console.log("No AI message found in 'values' event data:", data); // Keep commented unless debugging needed
    }
  };
  // --- End Helper function ---

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
    // setIsTyping(true); // Typing indicator is now started by handleIncomingChunk on first event
    
    // Increment message count in parent component
    if (onSendMessage) {
      onSendMessage();
    }
    
    // Get AI response via stream
    const assistantMessageId = `assistant-${Date.now()}`;
    assistantMessageIdRef.current = assistantMessageId; // Store the ID for handleIncomingChunk

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

    // --- Refined Stream Processing Loop ---
    try {
      const stream = await runAssistantStream(threadId, content);
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      // Use while loop for clarity
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // console.log("Stream finished."); // DEBUG LOG -> Removed
          handleStreamEnd(); // Process remaining buffer and clean up
          break; // Exit the loop
        }
        const chunk = decoder.decode(value, { stream: true });
        // console.log("Raw Chunk Received:", chunk); // DEBUG LOG -> Removed
        handleIncomingChunk(chunk); // Process the chunk
      }
    } catch (error) {
      console.error('Error getting AI stream response:', error);
      // Ensure cleanup happens even on error
      handleStreamEnd(); // Clear buffer, stop typing etc.
      // Update placeholder with error message
      setMessages((prev) => {
          const errorMsg = `Error: ${error instanceof Error ? error.message : 'Failed to get response.'}`;
          // Use the ID captured when the error occurred, before the ref might be cleared
          const targetId = assistantMessageId; // Use the ID captured at the start of handleSendMessage
          const placeholderIndex = prev.findIndex(msg => msg.id === targetId);
          if (placeholderIndex !== -1) {
              const updatedMessages = [...prev];
              updatedMessages[placeholderIndex] = {
                  ...updatedMessages[placeholderIndex],
                  content: errorMsg,
                  isError: true,
              };
              return updatedMessages;
          }
          // Fallback: add a new error message if placeholder is gone
          return [...prev, { id: `error-${Date.now()}`, role: 'assistant', content: errorMsg, timestamp: new Date(), isError: true }];
      });
      toast({
        title: "Error",
        description: `Failed to get a response: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false); // Ensure general loading stops
      // isTyping is handled by handleStreamEnd and catch block
    }
    // --- End Refined Stream Processing Loop ---
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
