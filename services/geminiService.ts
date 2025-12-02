import { GoogleGenAI, Type } from "@google/genai";
import { GeminiCommentary, AppMode } from '../types';

const getAiClient = () => {
  // Use process.env.API_KEY as per Google GenAI SDK guidelines
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeFrame = async (base64Image: string, mode: AppMode): Promise<GeminiCommentary | null> => {
  const ai = getAiClient();
  if (!ai) return null;

  // Remove data URL prefix if present for the API call
  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  const systemPrompt = mode === 'KISS' 
    ? `You are a hype announcer for a Stadium Kiss Cam. Analyze the image.
       If people are kissing, celebrate wildly! 
       If they are shy, encourage them. 
       If it's just one person, make a funny observation.
       Moods: romantic, funny, hype, awkward.`
    : `You are a hype announcer for a Stadium Drink Cam (Party Cam). Analyze the image.
       If people are drinking or toasting, celebrate wildly! "CHEERS!", "BOTTOMS UP!"
       If they are just holding drinks, hype them up.
       If they are not drinking, roast them gently to get a drink.
       Moods: party, funny, hype, spilled.`;

  const validMoods = mode === 'KISS' 
    ? ['romantic', 'funny', 'hype', 'awkward']
    : ['party', 'funny', 'hype', 'spilled'];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: "Return the response in JSON format."
          },
        ],
      },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "Short, punchy announcer commentary (max 15 words)" },
            mood: { type: Type.STRING, enum: validMoods },
            score: { type: Type.NUMBER, description: mode === 'KISS' ? "Kiss Score 0-100" : "Party Score 0-100" }
          },
          required: ["text", "mood", "score"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as GeminiCommentary;
    }
    return null;

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return {
      text: "Technical difficulties! But the party goes on!",
      mood: "funny",
      score: 0
    };
  }
};