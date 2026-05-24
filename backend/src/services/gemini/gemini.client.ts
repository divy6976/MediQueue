import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment");
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
}
