import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ENV } from "../../config/env";

let chatModelInstance: ChatGoogleGenerativeAI | null = null;

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
