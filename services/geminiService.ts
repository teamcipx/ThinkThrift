import { GoogleGenAI, Type } from "@google/genai";
import { UserAccount, AIAnalysisResult } from "../types";

// Initialize Gemini with the latest preview model
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeAccount = async (account: UserAccount): Promise<AIAnalysisResult | null> => {
  try {
    const prompt = `
      Perform a professional audit for this social media account.
      
      Account Profile:
      - Username: ${account.username}
      - Platform: ${account.platform}
      - Followers: ${account.followers}
      - Engagement: ${account.engagementRate}%
      - Bio: "${account.bio}"
      - Category: ${account.category}

      Provide a JSON response with:
      1. sentiment: (Positive/Neutral/Negative)
      2. strengths: Array of 3 specific strengths.
      3. weaknesses: Array of 3 potential growth blockers.
      4. growthStrategy: A data-driven 1-sentence growth advice.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
          },
          required: ["sentiment", "strengths", "weaknesses", "growthStrategy"]
        }
      }
    });

    return response.text ? JSON.parse(response.text) : null;
  } catch (error) {
    console.error("AI Audit Error:", error);
    return null;
  }
};

export const getPlatformTrends = async (platform: string): Promise<{ text: string; sources: any[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `What are the currently trending topics or algorithm shifts on ${platform} as of today? Provide a concise summary for a social media manager.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return {
      text: response.text || "No trend data available.",
      sources: sources
    };
  } catch (error) {
    console.error("Trend Search Error:", error);
    return { text: "Failed to fetch live trends.", sources: [] };
  }
};
