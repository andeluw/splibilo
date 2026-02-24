import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is required');
}

export const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
