import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Runnable } from "@langchain/core/runnables";
import { ENV } from "../../config/env";

export const LANGCHAIN_GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
  "gemini-2.5-pro",
  "gemini-flash-lite-latest"
];

export function getLangChainChatModel(options: {
  modelName?: string;
  temperature?: number;
  maxOutputTokens?: number;
} = {}): ChatGoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY || ENV.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("[LANGCHAIN ERROR] GEMINI_API_KEY is not configured in environment.");
  }

  const modelName = options.modelName || "gemini-2.5-flash";
  const temperature = options.temperature !== undefined ? options.temperature : 0.2;

  return new ChatGoogleGenerativeAI({
    apiKey,
    model: modelName,
    temperature,
    maxOutputTokens: options.maxOutputTokens || 2048,
  });
}

/**
 * Executes a LangChain runnable chain with automatic model fallback across supported Gemini model tiers
 * on transient 429 / 503 / quota limit errors.
 */
export async function invokeChainWithModelFallback(
  createChain: (model: ChatGoogleGenerativeAI) => Runnable,
  input: any,
  options: { temperature?: number; maxOutputTokens?: number } = {}
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || ENV.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("[LANGCHAIN ERROR] GEMINI_API_KEY is not configured in environment.");
  }

  let lastError: any = null;
  for (let i = 0; i < LANGCHAIN_GEMINI_MODELS.length; i++) {
    const modelName = LANGCHAIN_GEMINI_MODELS[i];
    try {
      const model = new ChatGoogleGenerativeAI({
        apiKey,
        model: modelName,
        temperature: options.temperature !== undefined ? options.temperature : 0.2,
        maxOutputTokens: options.maxOutputTokens || 2048,
      });
      const chain = createChain(model);
      const res = await chain.invoke(input);
      return typeof res === "string" ? res : (res?.content ? String(res.content) : JSON.stringify(res));
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.code || (err?.message?.includes("429") ? 429 : (err?.message?.includes("503") ? 503 : 0));
      const isTransient = status === 429 || status === 503 || err?.message?.includes("Quota") || err?.message?.includes("RESOURCE_EXHAUSTED") || err?.message?.includes("Too Many Requests");
      if (isTransient && i < LANGCHAIN_GEMINI_MODELS.length - 1) {
        console.warn(`[LANGCHAIN GEMINI RETRY] Model '${modelName}' encountered transient error (${status || err?.message}). Rotating to model tier '${LANGCHAIN_GEMINI_MODELS[i + 1]}'...`);
        await new Promise(r => setTimeout(r, 250 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export interface DiagnosticLangChainMeta {
  llmProvider: "google-genai";
  framework: "langchain";
  modelName: string;
  chainOrAgent: string;
  evidenceChunksRetrieved?: number;
  interviewerPersona?: string;
  timestamp: string;
}

export function createLangChainDiagnostics(
  chainOrAgent: string,
  extra: Partial<DiagnosticLangChainMeta> = {}
): DiagnosticLangChainMeta {
  return {
    llmProvider: "google-genai",
    framework: "langchain",
    modelName: "gemini-2.5-flash",
    chainOrAgent,
    timestamp: new Date().toISOString(),
    ...extra
  };
}
