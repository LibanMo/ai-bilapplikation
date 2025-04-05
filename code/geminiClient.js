// geminiClient.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = "AIzaSyA9BeZQuTchMG4nhk9nHQFPLMF18V17Y4o";
const genAI = new GoogleGenerativeAI(geminiApiKey);

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.0-pro-exp-02-05",
});
