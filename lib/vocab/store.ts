"use client";

import type { VocabItem } from "@/types/database";
import { getEffectiveUserId } from "@/lib/auth/store";

const STORAGE_PREFIX = "kmate_vocab_";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// 학습 퀴즈/채팅에서 맞힌 단어를 로컬(브라우저)에 영구 저장한다.
// 백엔드(FastAPI+MySQL)가 꺼져 있어도 단어장이 항상 동작하도록, localStorage를 1차 저장소로 쓰고
// 백엔드가 살아있으면 best-effort로 함께 동기화한다 (실패해도 로컬 저장에는 영향 없음).
// 로그인한 계정별로 분리되도록 저장 키 자체에 사용자 id를 포함한다.

export function getLocalVocab(): VocabItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + getEffectiveUserId());
    return raw ? (JSON.parse(raw) as VocabItem[]) : [];
  } catch {
    return [];
  }
}

function saveLocalVocab(items: VocabItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_PREFIX + getEffectiveUserId(), JSON.stringify(items));
}

interface AddVocabInput {
  character_id: string;
  word: string;
  reading?: string;
  meaning: string;
  sentence: string;
  sentence_translation: string;
}

export function addVocabWord(input: AddVocabInput): VocabItem {
  const userId = getEffectiveUserId();
  const items = getLocalVocab();
  const existing = items.find(
    (v) => v.word === input.word && v.character_id === input.character_id
  );

  if (existing) {
    // 이미 저장된 단어면 복습으로 취급 — 마스터리를 한 단계 올려준다
    const nextMastery =
      existing.mastery === "new" ? "learning" :
      existing.mastery === "learning" ? "reviewing" :
      existing.mastery === "reviewing" ? "mastered" : "mastered";
    existing.mastery = nextMastery;
    existing.review_count += 1;
    existing.last_reviewed_at = new Date().toISOString();
    saveLocalVocab(items);
    return existing;
  }

  const newItem: VocabItem = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    user_id: userId,
    character_id: input.character_id,
    word: input.word,
    reading: input.reading,
    meaning: input.meaning,
    sentence: input.sentence,
    sentence_translation: input.sentence_translation,
    mastery: "learning", // 퀴즈에서 정답을 맞히며 배운 것이므로 "new"보다 한 단계 위로 시작
    last_reviewed_at: new Date().toISOString(),
    review_count: 1,
    tags: [],
  };

  items.push(newItem);
  saveLocalVocab(items);

  // 백엔드가 켜져 있으면 함께 동기화 시도 (실패해도 무시 — 로컬 저장이 우선)
  fetch(`${BACKEND_URL}/vocab`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      character_id: input.character_id,
      region_id: "",
      word: input.word,
      reading: input.reading,
      meaning: input.meaning,
      sentence: input.sentence,
      sentence_translation: input.sentence_translation,
      tags: [],
    }),
  }).catch(() => {});

  return newItem;
}
