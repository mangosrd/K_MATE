"use client";

import type { VocabItem } from "@/types/database";
import { getEffectiveUserId } from "@/lib/auth/store";

const STORAGE_PREFIX = "kmate_vocab_";
const VOCAB_RESET_KEY = "kmate_vocab_reset_v2"; // 이 버전이 없으면 단어장 전체 초기화
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// 학습 퀴즈/채팅에서 배운 단어를 로컬(브라우저)에 영구 저장한다.
// 백엔드(FastAPI+MySQL)가 꺼져 있어도 단어장이 항상 동작하도록, localStorage를 1차 저장소로 쓰고
// 백엔드가 살아있으면 best-effort로 함께 동기화한다 (실패해도 로컬 저장에는 영향 없음).
// 로그인한 계정별로 분리되도록 저장 키 자체에 사용자 id를 포함한다.

// ── 단어장 버전 초기화 (앱 업데이트 시 구버전 데이터 자동 정리) ────────────────
// VOCAB_RESET_KEY가 localStorage에 없으면 저장된 단어 전체를 삭제하고 플래그를 세팅한다.
// 이 코드는 모듈 최초 로드(클라이언트 사이드) 시 1회만 실행된다.
if (typeof window !== "undefined" && !localStorage.getItem(VOCAB_RESET_KEY)) {
  // 모든 kmate_vocab_ 키를 찾아서 삭제
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) keysToRemove.push(key);
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
  localStorage.setItem(VOCAB_RESET_KEY, "1");
}

// ── 한국어 단어 유효성 검사 ──────────────────────────────────────────────────
// 국어사전에 등록될 법한 단어 기준:
//   - 순수 한글 음절(가~힣)로만 구성
//   - 2자 이상 7자 이하 (조사/어미 단독 제외, 너무 긴 어구 제외)
//   - 공백·숫자·영문·특수문자가 포함된 문장은 거부
// 이 필터 덕분에 채팅 대화 문장 전체가 단어장에 들어가는 걸 막는다.
function isValidKoreanWord(word: string): boolean {
  if (!word || !word.trim()) return false;
  const trimmed = word.trim();
  // 순수 한글만, 2자 이상 7자 이하
  return /^[가-힣]{2,7}$/.test(trimmed);
}

export function getLocalVocab(): VocabItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + getEffectiveUserId());
    if (!raw) return [];
    const items = JSON.parse(raw) as VocabItem[];
    // 과거 버그로 저장된 잘못된 항목들(뜻 없음 / 유효하지 않은 단어)을 걸러내고 재저장 (자가 치유)
    const cleaned = items.filter(
      (v) => v.meaning?.trim() && v.word?.trim() && isValidKoreanWord(v.word)
    );
    if (cleaned.length !== items.length) {
      saveLocalVocab(cleaned);
    }
    return cleaned;
  } catch {
    return [];
  }
}

function saveLocalVocab(items: VocabItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_PREFIX + getEffectiveUserId(), JSON.stringify(items));
}

/** 단어장 전체 초기화 (설정 화면에서 사용) */
export function clearLocalVocab(userId?: string) {
  if (typeof window === "undefined") return;
  const uid = userId ?? getEffectiveUserId();
  localStorage.removeItem(STORAGE_PREFIX + uid);
}


interface AddVocabInput {
  character_id: string;
  character_name?: string;  // 기장 이름 (단어 카드에 표시)
  word: string;
  reading?: string;
  meaning: string;
  sentence: string;
  sentence_translation: string;
}

export function addVocabWord(input: AddVocabInput): VocabItem | null {
  // ① 국어사전에 등록될 법한 한국어 단어만 허용
  if (!isValidKoreanWord(input.word)) return null;

  // ② 뜻이 없는 단어도 저장하지 않음
  if (!input.meaning || !input.meaning.trim()) return null;

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
    // character_name이 새로 들어오면 업데이트
    if (input.character_name) existing.character_name = input.character_name;
    saveLocalVocab(items);
    return existing;
  }

  const newItem: VocabItem = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    user_id: userId,
    character_id: input.character_id,
    character_name: input.character_name,
    word: input.word,
    reading: input.reading,
    meaning: input.meaning,
    sentence: input.sentence,
    sentence_translation: input.sentence_translation,
    mastery: "learning", // 퀴즈에서 맞히거나 카드를 확인한 것이므로 "new"보다 한 단계 위
    last_reviewed_at: new Date().toISOString(),
    review_count: 1,
    tags: [],
  };

  items.push(newItem);
  saveLocalVocab(items);

  // 백엔드가 켜져 있으면 함께 동기화 (실패해도 무시 — 로컬 저장이 우선)
  fetch(`${BACKEND_URL}/vocab`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      character_id: input.character_id,
      character_name: input.character_name ?? "",
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
