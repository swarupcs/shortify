"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ApiResponse } from "@/lib/types";
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
export type UrlSafetyCheck = { isSafe: boolean; flagged: boolean; reason: string | null; category: "safe" | "suspicious" | "malicious" | "inappropriate" | "unknown"; confidence: number; };

export async function checkUrlSafety(url: string): Promise<ApiResponse<UrlSafetyCheck>> {
  try {
    try { new URL(url); } catch { return { success: false, error: "Invalid URL format" }; }
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return { success: true, data: { isSafe: true, flagged: false, reason: null, category: "unknown", confidence: 0 } };
    }
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Analyze this URL for safety concerns: "${url}"\nConsider: phishing, malware, scams, inappropriate content, suspicious domains.\nRespond ONLY with JSON: {"isSafe": boolean, "flagged": boolean, "reason": string|null, "category": "safe"|"suspicious"|"malicious"|"inappropriate"|"unknown", "confidence": number}`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse JSON response");
    return { success: true, data: JSON.parse(jsonMatch[0]) as UrlSafetyCheck };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to check URL safety" };
  }
}
