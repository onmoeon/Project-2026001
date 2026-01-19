
import { GoogleGenAI } from "@google/genai";
import { EnhancementType, PromptSetting } from "../types";

const MODEL_NAME = 'gemini-3-flash-preview';

export const enhanceText = async (
  text: string, 
  promptSetting: PromptSetting,
  context: string = "",
  apiKey: string
): Promise<string> => {
  if (!text) return "";
  if (!apiKey) throw new Error("API Key is missing. Please set it in the top menu.");

  // Instantiate client with the specific user key
  const ai = new GoogleGenAI({ apiKey });

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
    throw new Error("Failed to enhance text. Please check your API Key and connection.");
  }
};
