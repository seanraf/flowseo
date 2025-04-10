
// Gemini API Service

const GEMINI_API_KEY = "AIzaSyAUfWWsq_uiZkRNtG-GMFDcj_GveFwGzzQ";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

interface GeminiRequestBody {
  contents: {
    parts: {
      text: string;
    }[];
  }[];
  generationConfig: {
    temperature: number;
    topK: number;
    topP: number;
    maxOutputTokens: number;
  };
}

interface GeminiResponsePart {
  text: string;
}

interface GeminiResponseContent {
  parts: GeminiResponsePart[];
  role: string;
}

interface GeminiResponse {
  candidates: {
    content: GeminiResponseContent;
    finishReason: string;
  }[];
}

export const generateGeminiResponse = async (prompt: string): Promise<string> => {
  try {
    const requestBody: GeminiRequestBody = {
      contents: [
        {
          parts: [
            {
              text: `You are ChatSEO, an AI assistant specialized in SEO research, keyword selection, and content generation. 
              The user is asking: ${prompt}. 
              Provide a helpful response with SEO insights.`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    };

    const response = await fetch(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    
    if (data.candidates && data.candidates.length > 0 && 
        data.candidates[0].content && 
        data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error("No response from Gemini API");
    }
  } catch (error) {
    console.error("Error generating Gemini response:", error);
    throw error;
  }
};
