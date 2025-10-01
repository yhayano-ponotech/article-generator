import { GoogleGenerativeAI } from "@google/generative-ai";
import { ArticleMeta, GeminiConfig } from "@/types/domain";
import {
  META_SUGGESTION_SYSTEM_PROMPT,
  ARTICLE_GENERATION_SYSTEM_PROMPT,
  ARTICLE_GENERATION_DEVELOPER_PROMPT,
  generateMetaSuggestionPrompt,
  generateArticlePrompt,
} from "./prompts";

const DEFAULT_MODEL = "gemini-2.5-flash-preview-09-2025";

/**
 * Initialize Gemini AI client
 */
export function createGeminiClient(apiKey: string): GoogleGenerativeAI {
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Suggest meta information from user input
 * Returns ArticleMeta object parsed from JSON response
 */
export async function suggestMeta(
  client: GoogleGenerativeAI,
  userInput: string,
  config?: Partial<GeminiConfig>
): Promise<ArticleMeta> {
  const model = client.getGenerativeModel({
    model: config?.model || DEFAULT_MODEL,
    generationConfig: {
      temperature: config?.temperature ?? 0.7,
      maxOutputTokens: config?.maxOutputTokens ?? 2048,
      responseMimeType: "application/json",
    },
    systemInstruction: META_SUGGESTION_SYSTEM_PROMPT,
  });

  const userPrompt = generateMetaSuggestionPrompt(userInput);
  const result = await model.generateContent(userPrompt);
  const response = result.response;
  const text = response.text();

  try {
    const parsed = JSON.parse(text) as ArticleMeta;
    return parsed;
  } catch (error) {
    throw new Error(`Failed to parse meta suggestion response: ${error}`);
  }
}

/**
 * Generate article with streaming
 * Yields text chunks as they arrive
 */
export async function* streamArticle(
  client: GoogleGenerativeAI,
  meta: ArticleMeta,
  additionalInstructions?: string,
  config?: Partial<GeminiConfig>
): AsyncGenerator<string, void, unknown> {
  const model = client.getGenerativeModel({
    model: config?.model || DEFAULT_MODEL,
    generationConfig: {
      temperature: config?.temperature ?? 0.7,
      maxOutputTokens: config?.maxOutputTokens ?? 8192,
    },
    systemInstruction: {
      role: "system",
      parts: [
        { text: ARTICLE_GENERATION_SYSTEM_PROMPT },
        { text: ARTICLE_GENERATION_DEVELOPER_PROMPT },
      ],
    },
  });

  const userPrompt = generateArticlePrompt(meta, additionalInstructions);
  const result = await model.generateContentStream(userPrompt);

  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    if (chunkText) {
      yield chunkText;
    }
  }
}

/**
 * Utility: Get API key from localStorage
 * SECURITY NOTE: In production, use HTTP referrer restriction in Google AI Studio
 */
export function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("gemini_api_key");
}

/**
 * Utility: Set API key to localStorage
 * SECURITY NOTE: In production, use HTTP referrer restriction in Google AI Studio
 */
export function setApiKey(apiKey: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("gemini_api_key", apiKey);
}

/**
 * Utility: Clear API key from localStorage
 */
export function clearApiKey(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("gemini_api_key");
}
