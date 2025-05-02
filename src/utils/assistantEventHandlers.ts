
import { Message } from '@/components/MessageItem';
import { useToast } from '@/components/ui/use-toast';

interface StreamEvent {
  type: string;
  data?: any;
  metadata?: any;
  messages?: any[];
}

/**
 * Process values events from the assistant stream
 */
export const processValuesEvent = (
  data: any, 
  targetAssistantId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
) => {
  const latestAiMessage = data?.messages?.filter((m: any) => m.type === 'ai').pop();

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
};

/**
 * Handles a chunk of data from the stream
 */
export const handleStreamChunk = (
  chunk: string,
  bufferRef: React.MutableRefObject<string>,
  isTyping: boolean,
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>,
  processValuesCallback: (data: any, finalAssistantId: string | null) => void,
  finalAssistantId: string | null = null
) => {
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
              processValuesCallback(parsedData, finalAssistantId);
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
};
