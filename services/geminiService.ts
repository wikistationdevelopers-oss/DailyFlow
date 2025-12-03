import { GoogleGenAI, Type } from "@google/genai";
import { Task } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const PLAN_MODEL_NAME = 'gemini-2.5-flash';
const CHAT_MODEL_NAME = 'gemini-3-pro-preview';

export const LIVE_MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-09-2025';

export const generatePlan = async (goal: string, timeFrame: 'day' | 'week'): Promise<string[]> => {
  try {
    const prompt = `Create a concrete list of 3-5 concise tasks to achieve the following goal for my ${timeFrame}: "${goal}". Return ONLY the tasks as a JSON array of strings.`;

    const response = await ai.models.generateContent({
      model: PLAN_MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    // Clean potential markdown formatting just in case
    const jsonString = text.replace(/```json|```/g, "").trim();
    
    return JSON.parse(jsonString) as string[];
  } catch (error) {
    console.error("Gemini Plan Error:", error);
    throw new Error("Failed to generate plan. Please try again.");
  }
};

export const chatWithAI = async (message: string, currentTasks: Task[]): Promise<string> => {
  try {
    const taskContext = currentTasks.map(t => `- ${t.text} (${t.completed ? 'Done' : 'Pending'})`).join('\n');
    
    const prompt = `
      System: You are a helpful, encouraging productivity assistant.
      Context: The user has the following tasks in their list:
      ${taskContext}
      
      User Message: ${message}
      
      Respond efficiently and kindly. If the user asks to add a task, suggest they use the "Generate Plan" feature or guide them to add it manually, but mostly provide advice, motivation, or answers.
    `;

    const response = await ai.models.generateContent({
      model: CHAT_MODEL_NAME,
      contents: prompt,
    });

    return response.text || "I'm having trouble thinking right now. Try again?";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Sorry, I couldn't reach the server. Check your connection.";
  }
};

export const getLiveClient = () => {
   return ai;
}