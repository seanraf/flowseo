
import { createThread, runAssistantStream } from '@/services/langGraphService';
import { useToast } from '@/components/ui/use-toast';
import { ToastProps } from '@/components/ui/toast';

// Update the toast parameter type to accept just the toast function
export const initializeAssistantThread = async (
  conversationId: string,
  setThreadId: React.Dispatch<React.SetStateAction<string | null>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  toast: {
    toast: (props: ToastProps) => { id: string; dismiss: () => void; update: any }
  }
) => {
  try {
    // Attempt to retrieve threadId from sessionStorage first
    const storedThreadId = sessionStorage.getItem(`threadId_${conversationId}`);
    console.log("Stored threadId:", storedThreadId);
    
    if (storedThreadId) {
      setThreadId(storedThreadId);
      return { success: true, threadId: storedThreadId };
    } else {
      console.log("Creating a new thread...");
      const newThreadId = await createThread();
      console.log("New threadId created:", newThreadId);
      setThreadId(newThreadId);
      sessionStorage.setItem(`threadId_${conversationId}`, newThreadId);
      return { success: true, threadId: newThreadId };
    }
  } catch (error) {
    console.error("Error initializing thread:", error);
    toast.toast({
      title: "Error",
      description: "Failed to initialize chat session. Please refresh.",
      variant: "destructive",
    });
    return { success: false, error };
  }
};

/**
 * Sends a message to the assistant and starts streaming the response
 */
export const sendAssistantMessage = async ({
  threadId,
  content,
  assistantMessageId,
  handleIncomingChunk,
  handleStreamEnd
}: {
  threadId: string;
  content: string;
  assistantMessageId: string;
  handleIncomingChunk: (chunk: string) => void;
  handleStreamEnd: () => void;
}) => {
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
    
    return { success: true };
  } catch (error) {
    console.error('Error getting AI stream response:', error);
    handleStreamEnd();
    return { 
      success: false, 
      error,
      errorMessage: error instanceof Error ? error.message : 'Failed to get response.'
    };
  }
};
