// ============================================================
// LLM 라우터 — Groq (확장 시 Gemini, OpenRouter 추가)
// 서버 전용 (Server-side only) — 클라이언트에서 import 금지
// ============================================================

import Groq from "groq-sdk";

if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY is not set in .env.local");
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export type LLMMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export interface LLMOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

// 기본 모델: llama-3.3-70b-versatile (빠르고 한국어 강함)
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

/**
 * LLM 라우터 — 대화/기억추출/일기생성 모두 이 함수를 통해 호출
 * 모델 변경 시 이 파일만 수정
 */
export async function llmChat(
  messages: LLMMessage[],
  options: LLMOptions = {}
): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: options.model ?? DEFAULT_MODEL,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 512,
  });

  return completion.choices[0]?.message?.content ?? "";
}

/**
 * 스트리밍 버전 — 대화 화면 실시간 타이핑 효과용
 */
export async function llmStream(
  messages: LLMMessage[],
  options: LLMOptions = {}
): Promise<ReadableStream> {
  const stream = await groq.chat.completions.create({
    model: options.model ?? DEFAULT_MODEL,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 512,
    stream: true,
  });

  return new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) {
          controller.enqueue(new TextEncoder().encode(text));
        }
      }
      controller.close();
    },
  });
}
