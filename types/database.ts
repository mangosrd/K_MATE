// ============================================================
// K-MATE 데이터베이스 타입 v2
// ============================================================

export type Language = "en" | "ko" | "ja" | "zh" | "vi" | "th" | "id";
export type MemoryType = "fact" | "preference" | "progress" | "emotion";
export type MasteryLevel = "new" | "learning" | "reviewing" | "mastered";
export type MembershipTier = "free" | "premium";
export type RegionId = "seoul" | "jeonju" | "busan" | "chungcheong" | "jeju";
export type StepStatus = "completed" | "active" | "locked";
export type ExerciseType = "flashcard" | "multiple_choice" | "fill_blank" | "translation";

// ---- 사용자 ----
export interface User {
  id: string;
  name: string;
  language: Language;
  level: number;
  membership: MembershipTier;
  free_character_slots: string[]; // 무료로 선택한 캐릭터 ID 목록 (최대 2)
  created_at: string;
}

// ---- 캐릭터 ----
export interface Character {
  id: string;
  region_id: RegionId;
  name: string;
  persona: string;
  avatar_url: string;
  emoji: string;
  description: string;
  description_en: string;
  tags: string[];
  requires_premium: boolean; // 유료 전용 여부
}

// ---- 권역 ----
export interface Region {
  id: RegionId;
  name: string;          // "서울·경기"
  name_en: string;       // "Seoul & Gyeonggi"
  airport_code: string;  // "SEL" (탑승권 스타일)
  description: string;
  description_en: string;
  thumbnail_url: string;
  place_count: number;
  is_locked: boolean;    // 지역 자체 잠금 (서울만 기본 해금)
  character_ids: string[];
}

// ---- 장소 ----
export interface Place {
  id: string;
  region_id: RegionId;
  name: string;
  name_ko: string;
  description: string;
  history: string;
  hours: string;
  address: string;
  facts: string[];
  order: number;
}

// ---- 진도·호감도 ----
export interface Progress {
  id: string;
  user_id: string;
  character_id: string;
  affinity: number;
  stamps: string[];
  current_step: number;
  visited_places: string[];
  streak_days: number;
  last_active_at: string;
}

// ---- 기억 ----
export interface Memory {
  id: string;
  user_id: string;
  character_id: string;
  type: MemoryType;
  content: string;
  created_at: string;
}

// ---- 챕터 ----
export interface Chapter {
  id: string;
  character_id: string;
  order: number;
  title: string;        // "첫 만남과 인사"
  title_en: string;
  description: string;
  emoji: string;
  step_count: number;   // 10
  total_items: number;  // 단어+문장 합계
  is_locked: boolean;
}

// ---- 학습 단계 (Step) ----
export interface LearningStep {
  id: string;
  chapter_id: string;
  step_number: number;  // 1~10
  title: string;
  exercises: Exercise[];
}

// ---- 연습 문제 ----
export interface Exercise {
  id: string;
  type: ExerciseType;
  question: string;
  question_ko?: string;
  answer: string;
  options?: string[];   // 객관식 보기
  hint?: string;
  word?: string;        // 핵심 단어
  sentence?: string;    // 예문
  sentence_translation?: string;
}

// ---- 단어장 ----
export interface VocabItem {
  id: string;
  user_id: string;
  character_id: string;
  word: string;
  reading?: string;
  meaning: string;
  sentence: string;
  sentence_translation: string;
  mastery: MasteryLevel;
  last_reviewed_at: string | null;
  review_count: number;
  tags: string[];
}

// ---- 일기 ----
export interface DiaryEntry {
  id: string;
  user_id: string;
  character_id: string;
  body_ko: string;
  place_name: string;
  unlocked: boolean;
  unlock_cost: number;
  created_at: string;
}

// ---- 경제 ----
export interface Economy {
  id: string;
  user_id: string;
  coins: number;
}

export interface EconomyLog {
  id: string;
  user_id: string;
  delta: number;
  reason: string;
  created_at: string;
}

// ---- 멤버십 ----
export interface Membership {
  id: string;
  user_id: string;
  tier: MembershipTier;
  started_at: string;
  expires_at: string | null; // null = 영구
  price_krw: number;
}
