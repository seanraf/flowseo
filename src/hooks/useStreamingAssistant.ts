
import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Message } from '@/components/MessageItem';
import { initializeAssistantThread, sendAssistantMessage } from '@/utils/assistantThreadUtils';
import { handleStreamChunk, processValuesEvent } from '@/utils/assistantEventHandlers';

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

  // Process values events coming from the assistant
  const processValues = useCallback((data: any, finalAssistantId: string | null = null) => {
    const targetAssistantId = finalAssistantId ?? assistantMessageIdRef.current;
    processValuesEvent(data, targetAssistantId, setMessages);
  }, []);

  // Handle incoming chunk from the stream
  const handleIncomingChunk = useCallback((chunk: string) => {
    handleStreamChunk(
      chunk, 
      bufferRef, 
      isTyping, 
      setIsTyping, 
      processValues,
      assistantMessageIdRef.current
    );
  }, [isTyping, processValues]);

  // Handle stream end
  const handleStreamEnd = useCallback(() => {
    const finalAssistantId = assistantMessageIdRef.current;
    
    if (bufferRef.current.trim()) {
      console.warn("Final buffer content (attempting final parse):", bufferRef.current);
      handleStreamChunk(
        "\n\n", 
        bufferRef, 
        isTyping, 
        setIsTyping, 
        processValues,
        finalAssistantId
      );
    }
    
    bufferRef.current = "";
    setIsTyping(false);
    assistantMessageIdRef.current = null;
    console.log("Stream end processed, buffer cleared, typing stopped.");
  }, [isTyping, processValues]);

  // Initialize thread
  const initializeThread = useCallback(async (conversationId: string, welcomeMessage: Message) => {
    setIsLoading(true);
    console.log("Initializing thread for activeConversationId:", conversationId);
    
    const result = await initializeAssistantThread(conversationId, setThreadId, setIsLoading, { toast });
    
    if (result.success) {
      setMessages([welcomeMessage]);
    } else {
      setMessages([welcomeMessage]);
    }
    
    setIsLoading(false);
  }, [toast]);

  // Send message
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

    const result = await sendAssistantMessage({
      threadId,
      content,
      assistantMessageId,
      handleIncomingChunk,
      handleStreamEnd
    });

    if (!result.success) {
      const errorMsg = `Error: ${result.errorMessage}`;
      setMessages((prev) => {
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
        description: `Failed to get a response: ${result.errorMessage}. Please try again.`,
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
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
