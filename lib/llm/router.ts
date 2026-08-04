// ============================================================
// LLM 라우터 — Gemini (확장 시 OpenRouter 등 추가)
// 서버 전용 (Server-side only) — 클라이언트에서 import 금지
// ============================================================

import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in .env.local");
}

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export type LLMMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export interface LLMOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

// 기본 모델: gemini-flash-lite-latest — 이 프로젝트 무료 티어 키 기준, pro 계열은
// 할당량이 0이고 gemini-flash-latest(3.6-flash)는 응답이 깨져 나와서(시스템 지시문
// 조각이 그대로 새어나옴) 실제로 안정적으로 동작하는 게 flash-lite뿐이었다.
const DEFAULT_MODEL = "gemini-flash-lite-latest";

function toGeminiRequest(messages: LLMMessage[]) {
  const systemInstruction = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n") || undefined;

  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  return { systemInstruction, contents };
}

/**
 * LLM 라우터 — 대화/기억추출 등 서버 전용 LLM 호출은 모두 이 함수를 통해 호출
 * 모델 변경 시 이 파일만 수정
 */
export async function llmChat(
  messages: LLMMessage[],
  options: LLMOptions = {}
): Promise<string> {
  const { systemInstruction, contents } = toGeminiRequest(messages);

  const response = await gemini.models.generateContent({
    model: options.model ?? DEFAULT_MODEL,
    contents,
    config: {
      systemInstruction,
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.max_tokens ?? 512,
    },
  });

  return response.text ?? "";
}

/**
 * 스트리밍 버전 — 대화 화면 실시간 타이핑 효과용
 */
export async function llmStream(
  messages: LLMMessage[],
  options: LLMOptions = {}
): Promise<ReadableStream> {
  const { systemInstruction, contents } = toGeminiRequest(messages);

  const stream = await gemini.models.generateContentStream({
    model: options.model ?? DEFAULT_MODEL,
    contents,
    config: {
      systemInstruction,
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.max_tokens ?? 512,
    },
  });

  return new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.text ?? "";
        if (text) {
          controller.enqueue(new TextEncoder().encode(text));
        }
      }
      controller.close();
    },
  });
}
