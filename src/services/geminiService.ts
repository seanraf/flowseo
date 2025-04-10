// Gemini API Service
import { processKwrdsRequest, KwrdsApiResponse } from './kwrdsService';
import axios from 'axios';

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
  text: string | undefined;
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

// Helper function to detect SEO-related requests
const detectSeoRequest = (prompt: string): { isKwrdsRequest: boolean, type: 'keywords' | 'content' | 'metatags' | null, params: any } => {
  const lowerPrompt = prompt.toLowerCase();

  // Check for keyword research request
  if (
    lowerPrompt.includes('keyword') &&
    (lowerPrompt.includes('research') || lowerPrompt.includes('suggestions') || lowerPrompt.includes('ideas'))
  ) {
    // Extract the main topic
    let seed = prompt.replace(/keywords|research|suggestions|ideas|for|me|find|get/gi, '').trim();
    return { isKwrdsRequest: true, type: 'keywords', params: { seed } };
  }

  // Check for content generation request
  else if (
    lowerPrompt.includes('generate content') ||
    lowerPrompt.includes('write content') ||
    lowerPrompt.includes('create content')
  ) {
    // Extract topic and keywords
    const topic = prompt.replace(/generate|write|create|content|for|about|with|keywords/gi, '').trim();
    const keywords = []; // In a real app, we would extract keywords if provided
    return { isKwrdsRequest: true, type: 'content', params: { topic, keywords } };
  }

  // Check for meta tags generation request
  else if (
    lowerPrompt.includes('meta tags') ||
    lowerPrompt.includes('seo tags') ||
    lowerPrompt.includes('meta description')
  ) {
    const topic = prompt.replace(/meta tags|seo tags|meta description|generate|create|for|about/gi, '').trim();
    const keywords = []; // In a real app, we would extract keywords if provided
    return { isKwrdsRequest: true, type: 'metatags', params: { topic, keywords } };
  }

  return { isKwrdsRequest: false, type: null, params: null };
};

// Function to format kwrds.ai API responses
const formatKwrdsResponse = (response: KwrdsApiResponse): string => {
  switch (response.type) {
    case 'keywords':
      const keywords = response.data as any[];
      return `## Keyword Suggestions\n\n${keywords.map((k, i) =>
        `${i + 1}. **${k.keyword}**\n   - Score: ${k.score}\n   - Volume: ${k.volume}\n   - Difficulty: ${k.difficulty}\n`
      ).join('\n')}`;

    case 'content':
      return `## Generated Content\n\n${(response.data as any).content}`;

    case 'metatags':
      const metaTags = response.data as any;
      return `## SEO Meta Tags\n\n**Title:** ${metaTags.title}\n\n**Description:** ${metaTags.description}\n\n**Tags:** ${metaTags.tags.join(', ')}`;

    default:
      return "Unknown response type";
  }
};

const fetchUrlContent = async (url: string): Promise<string> => {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching URL content:", error);
    throw error;
  }
};

const extractMainKeyword = async (url: string): Promise<string> => {
  try {
    const content = await fetchUrlContent(url);
    const prompt = `Summarize the following content and extract the main keyword: ${content}`;

    const requestBody: GeminiRequestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
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

    if (
      data &&
      data.candidates &&
      Array.isArray(data.candidates) &&
      data.candidates.length > 0 &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      Array.isArray(data.candidates[0].content.parts) &&
      data.candidates[0].content.parts.length > 0
    ) {
      const text = data.candidates[0].content.parts[0].text;
      if (typeof text === 'string') {
        return text;
      } else {
        console.error("Gemini API returned non-string content:", text);
        throw new Error("Gemini API returned non-string content");
      }
    } else {
      throw new Error("No response from Gemini API");
    }
  } catch (error) {
    console.error("Error generating Gemini response:", error);
    throw error;
  }
};

export const generateGeminiResponse = async (prompt: string): Promise<string> => {
  try {
    if (prompt.startsWith('http://') || prompt.startsWith('https://')) {
      try {
        const keyword = await extractMainKeyword(prompt);
        
        try {
          const kwrdsResponse = await processKwrdsRequest('keywords', { seed: keyword });
          const formattedResponse = formatKwrdsResponse(kwrdsResponse);
          return `${formattedResponse}\n\nAsk me more questions about ${keyword}!`;
        } catch (error) {
          console.error("Error with kwrds.ai API:", error);
          return `Error with kwrds.ai API. Please try again.`;
        }
      } catch (error) {
        console.error("Error extracting keyword from URL:", error);
        return "Error extracting keyword from URL. Please try again.";
      }
    }
    // First, check if this is an SEO-specific request for kwrds.ai
    const { isKwrdsRequest, type, params } = detectSeoRequest(prompt);

    if (isKwrdsRequest && type) {
      try {
        const kwrdsResponse = await processKwrdsRequest(type, params);
        return formatKwrdsResponse(kwrdsResponse);
      } catch (error) {
        console.error("Error with kwrds.ai API:", error);
        // Fall back to Gemini if kwrds.ai fails
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
    }

    // Otherwise, use Gemini API
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
    }
  } catch (error) {
    console.error("Error generating Gemini response:", error);
    throw error;
  }
};
