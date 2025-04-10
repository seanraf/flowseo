
// kwrds.ai API Service

const KWRDS_API_KEY = "032704f1-2750-49b7-bb25-ce6025361364";
const KWRDS_API_BASE_URL = "https://www.kwrds.ai/api";

// Interfaces for API responses
interface KeywordSuggestion {
  keyword: string;
  score: number;
  volume: number;
  difficulty: number;
  cpc: number;
  competition: number;
}

interface MetaTagsResponse {
  title: string;
  description: string;
  tags: string[];
}

interface ContentGenerationResponse {
  content: string;
}

export interface KwrdsApiResponse {
  type: 'keywords' | 'content' | 'metatags';
  data: KeywordSuggestion[] | ContentGenerationResponse | MetaTagsResponse;
}

// Function to get AI-powered keyword suggestions
export const getKeywordSuggestions = async (seed: string): Promise<KeywordSuggestion[]> => {
  try {
    const response = await fetch(`${KWRDS_API_BASE_URL}/keywords?seed=${encodeURIComponent(seed)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${KWRDS_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error fetching keyword suggestions: ${response.status}`);
    }

    const data = await response.json();
    return data as KeywordSuggestion[];
  } catch (error) {
    console.error("Error fetching keyword suggestions:", error);
    throw error;
  }
};

// Function to generate content using AI
export const generateContent = async (topic: string, keywords: string[]): Promise<string> => {
  try {
    const response = await fetch(`${KWRDS_API_BASE_URL}/content`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${KWRDS_API_KEY}`
      },
      body: JSON.stringify({
        topic,
        keywords
      })
    });

    if (!response.ok) {
      throw new Error(`Error generating content: ${response.status}`);
    }

    const data = await response.json();
    return (data as ContentGenerationResponse).content;
  } catch (error) {
    console.error("Error generating content:", error);
    throw error;
  }
};

// Function to generate SEO meta tags
export const generateMetaTags = async (topic: string, keywords: string[]): Promise<MetaTagsResponse> => {
  try {
    const response = await fetch(`${KWRDS_API_BASE_URL}/metatags`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${KWRDS_API_KEY}`
      },
      body: JSON.stringify({
        topic,
        keywords
      })
    });

    if (!response.ok) {
      throw new Error(`Error generating meta tags: ${response.status}`);
    }

    const data = await response.json();
    return data as MetaTagsResponse;
  } catch (error) {
    console.error("Error generating meta tags:", error);
    throw error;
  }
};

// Function to process SEO-related requests
export const processKwrdsRequest = async (requestType: 'keywords' | 'content' | 'metatags', params: any): Promise<KwrdsApiResponse> => {
  try {
    switch (requestType) {
      case 'keywords':
        const keywords = await getKeywordSuggestions(params.seed);
        return { type: 'keywords', data: keywords };
      
      case 'content':
        const content = await generateContent(params.topic, params.keywords);
        return { type: 'content', data: { content } };
      
      case 'metatags':
        const metaTags = await generateMetaTags(params.topic, params.keywords);
        return { type: 'metatags', data: metaTags };
      
      default:
        throw new Error(`Unknown request type: ${requestType}`);
    }
  } catch (error) {
    console.error(`Error processing ${requestType} request:`, error);
    throw error;
  }
};
