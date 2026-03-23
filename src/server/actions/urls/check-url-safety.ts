"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { ApiResponse } from "@/lib/types";
import { db } from "@/server/db";
import { counters } from "@/server/db/schema";
import { sql } from "drizzle-orm";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export type UrlSafetyCheck = {
  isSafe: boolean;
  flagged: boolean;
  reason: string | null;
  category: "safe" | "suspicious" | "malicious" | "inappropriate" | "unknown";
  confidence: number;
};

/**
 * Atomically increment the ai_scans_today counter.
 * Uses INSERT ... ON CONFLICT DO UPDATE so it works whether the row
 * exists or not. Fire-and-forget — never throws.
 */
async function incrementScanCounter(): Promise<void> {
  try {
    await db
      .insert(counters)
      .values({
        key: "ai_scans_today",
        value: 1,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: counters.key,
        set: {
          value: sql`${counters.value} + 1`,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    // Never throw — counter failure must not block URL shortening
    console.error("[ai-scan] Failed to increment scan counter:", error);
  }
}

export async function checkUrlSafety(
  url: string,
): Promise<ApiResponse<UrlSafetyCheck>> {
  try {
    try {
      new URL(url);
    } catch {
      return { success: false, error: "Invalid URL format" };
    }

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return {
        success: true,
        data: {
          isSafe: true,
          flagged: false,
          reason: null,
          category: "unknown",
          confidence: 0,
        },
      };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Analyze this URL for safety concerns: "${url}"
Consider: phishing, malware, scams, inappropriate content, suspicious domains.
Respond ONLY with JSON: {"isSafe": boolean, "flagged": boolean, "reason": string|null, "category": "safe"|"suspicious"|"malicious"|"inappropriate"|"unknown", "confidence": number}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse JSON response");

    const data = JSON.parse(jsonMatch[0]) as UrlSafetyCheck;

    // ── Increment counter after every successful Gemini call ────────────
    // Non-blocking — runs in background while we return the result
    incrementScanCounter();

    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to check URL safety" };
  }
}
