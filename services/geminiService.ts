import { GoogleGenAI, Type } from "@google/genai";
import { UserAccount, AIAnalysisResult } from "../types";

// Initialize Gemini
// Note: The API key must be obtained exclusively from process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeAccount = async (account: UserAccount): Promise<AIAnalysisResult | null> => {
  try {
    const prompt = `
      Analyze this social media profile for a database audit.
      
      Profile Data:
      Username: ${account.username}
      Platform: ${account.platform}
      Followers: ${account.followers}
      Engagement Rate: ${account.engagementRate}%
      Bio: "${account.bio}"
      Category: ${account.category}

      Provide a JSON response with:
      - sentiment: (Positive, Neutral, Negative) based on bio/performance.
      - strengths: Array of 2-3 key strengths.
      - weaknesses: Array of 2-3 potential issues.
      - growthStrategy: A short 1-sentence strategic advice.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            growthStrategy: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIAnalysisResult;
    }
    return null;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};

export const generateSearchFilter = async (query: string): Promise<any> => {
  try {
    const prompt = `
      Translate this natural language query into a JSON filter object for a database of social media accounts.
      
      Query: "${query}"
      
      Fields available: 
      - platform (Twitter, Instagram, LinkedIn, TikTok)
      - minFollowers (number)
      - maxFollowers (number)
      - minEngagement (number)
      - status (Active, Verified, Shadowbanned, Suspended)
      - category (string)

      Example Output: {"platform": "Twitter", "minEngagement": 5}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    return response.text ? JSON.parse(response.text) : null;
  } catch (e) {
    console.error(e);
    return null;
  }
};