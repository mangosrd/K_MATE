"use client";

import type { DiaryEntry } from "@/types/database";
import { MOCK_USER } from "@/lib/db/mock";

const STORAGE_KEY = "kmate_diary";

// 세션 종료 시 생성된 일기를 로컬(브라우저)에도 함께 저장한다.
// 백엔드(FastAPI+MySQL)가 꺼져 있어도 방금 쓴 일기가 화면에 남아있도록,
// 백엔드 저장 성공 여부와 무관하게 로컬에도 캐시해 둔다.

export function getLocalDiaries(characterId: string): DiaryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? (JSON.parse(raw) as DiaryEntry[]) : [];
    return all.filter((d) => d.character_id === characterId);
  } catch {
    return [];
  }
}

export function addLocalDiary(entry: Omit<DiaryEntry, "user_id">): DiaryEntry {
  if (typeof window === "undefined") {
    return { ...entry, user_id: MOCK_USER.id };
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  const all: DiaryEntry[] = raw ? JSON.parse(raw) : [];
  const full: DiaryEntry = { ...entry, user_id: MOCK_USER.id };
  all.push(full);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return full;
}
