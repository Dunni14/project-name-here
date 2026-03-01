import { GoogleGenAI, Type } from "@google/genai";
import { FoodItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function parseFoodDescription(description: string): Promise<Partial<FoodItem> | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Parse this food description and provide nutritional estimates: "${description}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fat: { type: Type.NUMBER },
            servingSize: { type: Type.STRING },
          },
          required: ["name", "calories", "protein", "carbs", "fat", "servingSize"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return {
      ...result,
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Error parsing food description:", error);
    return null;
  }
}
