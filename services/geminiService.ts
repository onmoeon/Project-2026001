
import { GoogleGenAI } from "@google/genai";
import { EnhancementType, PromptSetting } from "../types";

const MODEL_NAME = 'gemini-3-flash-preview';

export const enhanceText = async (
  text: string, 
  promptSetting: PromptSetting,
  context: string = "",
  apiKey?: string
): Promise<string> => {
  if (!text) return "";
  
  // Priority: 1. User provided key (localStorage) 2. Environment Variable
  const finalApiKey = apiKey || process.env.API_KEY;

  if (!finalApiKey) {
     throw new Error("API Key is missing. Please set it in the top menu or .env file.");
  }

  // Instantiate client with the key
  const ai = new GoogleGenAI({ apiKey: finalApiKey });

  // Replace placeholders in the custom template
  let finalPrompt = promptSetting.promptTemplate
    .replace('{{text}}', text)
    .replace('{{context}}', context);

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: finalPrompt,
      config: {
        systemInstruction: promptSetting.systemInstruction,
        temperature: 0.3,
      }
    });

    return response.text?.trim() || text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to enhance text. Check your API Key.");
  }
};
