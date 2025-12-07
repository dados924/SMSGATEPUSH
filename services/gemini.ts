import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const optimizeSMSContent = async (originalText: string): Promise<string> => {
  const ai = getAI();
  if (!ai) return originalText;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Rewrite the following SMS message to be concise, professional, and clear. Limit to 160 characters if possible. Message: "${originalText}"`,
    });
    return response.text?.trim() || originalText;
  } catch (error) {
    console.error("Gemini optimization failed:", error);
    return originalText;
  }
};

export const analyzeSecurity = async (text: string): Promise<{ score: number; advice: string }> => {
  const ai = getAI();
  if (!ai) return { score: 0, advice: "AI Unavailable" };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the security strength of this secret/password. Return JSON with 'score' (0-100) and 'advice' (string). Secret: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            advice: { type: Type.STRING }
          }
        }
      }
    });

    const jsonText = response.text || "{}";
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return { score: 50, advice: "Could not analyze." };
  }
};