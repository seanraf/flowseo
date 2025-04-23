// LangGraph API Service using Threads and Streaming

const LANGGRAPH_BASE_URL = "https://flowseo-langchain-830de3a38db8596f89b474712b4e58ea.us.langgraph.app";
// It's generally better to store API keys in environment variables, but using it directly for now as per instructions.
const LANGGRAPH_API_KEY = "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";
const ASSISTANT_ID = "agent"; // Assuming 'agent' is the correct assistant ID based on the curl example

interface CreateThreadResponse {
  thread_id: string;
  // Add other potential fields if known
}

interface RunAssistantRequestBody {
  input: {
    user_input: string; // Changed from 'question' to 'user_input' based on the guide
  };
  assistant_id: string;
}

interface HistoryResponse {
  // Define the structure based on the actual history response
  // Example: messages: Array<{ role: string; content: string }>;
  [key: string]: any; // Placeholder
}

const commonHeaders = {
  "Content-Type": "application/json",
  "X-Api-Key": LANGGRAPH_API_KEY,
};

/**
 * Creates a new LangGraph thread.
 * @returns The thread ID.
 */
export const createThread = async (): Promise<string> => {
  try {
    const response = await fetch(`${LANGGRAPH_BASE_URL}/threads`, {
      method: "POST",
      headers: commonHeaders,
      body: JSON.stringify({})
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("LangGraph API error (createThread):", response.status, errorData);
      throw new Error(`LangGraph API error: ${response.status}. ${errorData}`);
    }

    const data: CreateThreadResponse = await response.json();
    if (!data || !data.thread_id) {
      console.error("Unexpected response structure from LangGraph (createThread):", data);
      throw new Error("Failed to create thread: Invalid response structure.");
    }
    return data.thread_id;
  } catch (error) {
    console.error("Error creating LangGraph thread:", error);
    throw new Error("Failed to create LangGraph thread."); // Re-throw for the caller to handle
  }
};

/**
 * Runs the assistant on a specific thread with streaming.
 * @param threadId The ID of the thread.
 * @param userInput The user's input message.
 * @returns A ReadableStream of the response chunks.
 */
export const runAssistantStream = async (threadId: string, userInput: string): Promise<ReadableStream<Uint8Array>> => {
  try {
    const requestBody = {
      input: {
        messages: [
          { role: "user", content: userInput }
        ]
      },
      assistant_id: ASSISTANT_ID,
    };

    const response = await fetch(`${LANGGRAPH_BASE_URL}/threads/${threadId}/runs/stream`, {
      method: "POST",
      headers: commonHeaders,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("LangGraph API error (runAssistantStream):", response.status, errorData);
      throw new Error(`LangGraph API error: ${response.status}. ${errorData}`);
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    return response.body;
  } catch (error) {
    console.error("Error running LangGraph assistant stream:", error);
    throw new Error("Failed to run LangGraph assistant stream."); // Re-throw
  }
};

/**
 * Retrieves the history for a specific thread.
 * @param threadId The ID of the thread.
 * @returns The chat history.
 */
export const getHistory = async (threadId: string): Promise<HistoryResponse> => {
  try {
    const response = await fetch(`${LANGGRAPH_BASE_URL}/threads/${threadId}/history`, {
      method: "GET", // GET request for history
      headers: {
        "X-Api-Key": LANGGRAPH_API_KEY, // Only API key needed for GET
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("LangGraph API error (getHistory):", response.status, errorData);
      throw new Error(`LangGraph API error: ${response.status}. ${errorData}`);
    }

    const data: HistoryResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting LangGraph history:", error);
    throw new Error("Failed to get LangGraph history."); // Re-throw
  }
};
