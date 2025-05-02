
import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Message } from '@/components/MessageItem';
import { createThread, runAssistantStream } from '@/services/langGraphService';

interface UseStreamingAssistantProps {
  onSendMessage?: () => void;
  messageLimitReached?: boolean;
}

export const useStreamingAssistant = ({ onSendMessage, messageLimitReached = false }: UseStreamingAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const { toast } = useToast();
  const bufferRef = useRef("");
  const assistantMessageIdRef = useRef<string | null>(null);

  // Initialize thread
  const initializeThread = useCallback(async (conversationId: string, welcomeMessage: Message) => {
    setIsLoading(true);
    console.log("Initializing thread for activeConversationId:", conversationId);
    
    try {
      // Attempt to retrieve threadId from sessionStorage first
      const storedThreadId = sessionStorage.getItem(`threadId_${conversationId}`);
      console.log("Stored threadId:", storedThreadId);
      
      if (storedThreadId) {
        setThreadId(storedThreadId);
        setMessages([welcomeMessage]);
      } else {
        console.log("Creating a new thread...");
        const newThreadId = await createThread();
        console.log("New threadId created:", newThreadId);
        setThreadId(newThreadId);
        sessionStorage.setItem(`threadId_${conversationId}`, newThreadId);
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error("Error initializing thread:", error);
      toast({
        title: "Error",
        description: "Failed to initialize chat session. Please refresh.",
        variant: "destructive",
      });
      setMessages([welcomeMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Process incoming chunks
  const handleIncomingChunk = useCallback((chunk: string, finalAssistantId: string | null = null) => {
    bufferRef.current += chunk;
    
    const eventDelimiter = '\n\n';
    let eventEnd = bufferRef.current.indexOf(eventDelimiter);

    while (eventEnd !== -1) {
      const rawEventsBlock = bufferRef.current.slice(0, eventEnd).trim();
      bufferRef.current = bufferRef.current.slice(eventEnd + eventDelimiter.length);

      if (!rawEventsBlock) {
          eventEnd = bufferRef.current.indexOf(eventDelimiter);
          continue;
      }

      const subEvents = rawEventsBlock.split(/(?=event:)/);

      subEvents.forEach(subEventString => {
        if (!subEventString.trim()) return;

        const lines = subEventString.trim().split('\n');
        let eventType = '';
        let data = '';

        lines.forEach(line => {
          if (line.startsWith('event:')) {
            eventType = line.replace('event:', '').trim();
          } else if (line.startsWith('data:')) {
            data += line.substring(5);
          }
        });

        if (eventType && data) {
          try {
            const parsedData = JSON.parse(data);
            switch (eventType) {
              case "metadata":
                if (!isTyping) setIsTyping(true);
                break;
              case "values":
                processValuesEvent(parsedData, finalAssistantId);
                break;
              default:
                console.warn(`Unhandled event type: ${eventType}`);
            }
          } catch (e) {
            console.error("JSON parsing failed for sub-event:", e, { eventType, data });
          }
        } else {
            console.warn("Skipping sub-event part without valid event/data:", subEventString);
        }
      });

      eventEnd = bufferRef.current.indexOf(eventDelimiter);
    }
  }, [isTyping]);

  // Process values events
  const processValuesEvent = useCallback((data: any, finalAssistantId: string | null = null) => {
    const latestAiMessage = data?.messages?.filter((m: any) => m.type === 'ai').pop();
    const targetAssistantId = finalAssistantId ?? assistantMessageIdRef.current;

    if (latestAiMessage && targetAssistantId) {
      setMessages((prevMessages) => {
        const messageIndex = prevMessages.findIndex(msg => msg.id === targetAssistantId);
        if (messageIndex !== -1) {
          const updatedMessages = [...prevMessages];
          updatedMessages[messageIndex] = {
            ...updatedMessages[messageIndex],
            content: latestAiMessage.content || '',
          };
          return updatedMessages;
        } else {
          console.warn("Assistant message placeholder not found for ID:", targetAssistantId);
          return prevMessages;
        }
      });
    } else if (!targetAssistantId) {
      console.warn("Received 'values' event but no target assistant message ID is available.");
    }
  }, []);

  // Handle stream end
  const handleStreamEnd = useCallback(() => {
    const finalAssistantId = assistantMessageIdRef.current;
    
    if (bufferRef.current.trim()) {
      console.warn("Final buffer content (attempting final parse):", bufferRef.current);
      handleIncomingChunk("\n\n", finalAssistantId);
    }
    
    bufferRef.current = "";
    setIsTyping(false);
    assistantMessageIdRef.current = null;
    console.log("Stream end processed, buffer cleared, typing stopped.");
  }, [handleIncomingChunk]);

  // Send message function
  const sendMessage = useCallback(async (content: string) => {
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
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    
    // Add user message to chat
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    
    // Increment message count in parent component
    if (onSendMessage) {
      onSendMessage();
    }
    
    // Get AI response via stream
    const assistantMessageId = `assistant-${Date.now()}`;
    assistantMessageIdRef.current = assistantMessageId;

    // Add a placeholder for the assistant message
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      },
    ]);

    try {
      const stream = await runAssistantStream(threadId, content);
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          handleStreamEnd();
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        handleIncomingChunk(chunk);
      }
    } catch (error) {
      console.error('Error getting AI stream response:', error);
      handleStreamEnd();
      setMessages((prev) => {
        const errorMsg = `Error: ${error instanceof Error ? error.message : 'Failed to get response.'}`;
        const targetId = assistantMessageId;
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
        return [...prev, { id: `error-${Date.now()}`, role: 'assistant', content: errorMsg, timestamp: new Date(), isError: true }];
      });
      toast({
        title: "Error",
        description: `Failed to get a response: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [threadId, messageLimitReached, onSendMessage, handleIncomingChunk, handleStreamEnd, toast]);

  return {
    messages,
    setMessages,
    isLoading,
    isTyping,
    threadId,
    initializeThread,
    sendMessage
  };
};
