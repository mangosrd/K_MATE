"use client";

import type { DiaryEntry } from "@/types/database";
import { getEffectiveUserId } from "@/lib/auth/store";

const STORAGE_PREFIX = "kmate_diary_";

// 세션 종료 시 생성된 일기를 로컬(브라우저)에도 함께 저장한다.
// 백엔드(FastAPI+MySQL)가 꺼져 있어도 방금 쓴 일기가 화면에 남아있도록,
// 백엔드 저장 성공 여부와 무관하게 로컬에도 캐시해 둔다.
// 로그인한 계정별로 분리되도록 저장 키 자체에 사용자 id를 포함한다.

export function getAllLocalDiaries(): DiaryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + getEffectiveUserId());
    return raw ? (JSON.parse(raw) as DiaryEntry[]) : [];
  } catch {
    return [];
  }
}

export function getLocalDiaries(characterId: string): DiaryEntry[] {
  return getAllLocalDiaries().filter((d) => d.character_id === characterId);
}

export function addLocalDiary(entry: Omit<DiaryEntry, "user_id">): DiaryEntry {
  const userId = getEffectiveUserId();
  if (typeof window === "undefined") {
    return { ...entry, user_id: userId };
  }
  const raw = localStorage.getItem(STORAGE_PREFIX + userId);
  const all: DiaryEntry[] = raw ? JSON.parse(raw) : [];
  const full: DiaryEntry = { ...entry, user_id: userId };
  all.push(full);
  localStorage.setItem(STORAGE_PREFIX + userId, JSON.stringify(all));
  return full;
}
