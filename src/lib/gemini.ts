import { GoogleGenerativeAI } from "@google/generative-ai";

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const GEMINI_IMAGE_MODEL = "gemini-2.0-flash-exp";
