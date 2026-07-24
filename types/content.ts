// ---- 챕터 학습 콘텐츠 (단어/문장/스토리 브리핑) ----
// lib/db/mock.ts의 Chapter는 목록 화면용 메타데이터이고,
// 이 타입들은 실제 학습 세션(app/learn/[characterId]/[chapterId])에서 쓰는 콘텐츠 본문이다.
// id는 Chapter.id("ch-k01" 등)와 동일한 체계를 쓴다.

export interface ChapterWord {
  id: string;
  word: string;
  reading: string;
  meaning: string;
  example: string;
  example_reading: string;
  example_en: string;
}

export interface ChapterSentence {
  id: string;
  ko: string;
  reading: string;
  en: string;
}

// 학습 시작 전 카카오톡 대화창 스타일로 보여주는 사전 브리핑 한 마디
export interface StoryBubble {
  text: string;
  reading?: string;
  en?: string;
  // 이 대사가 소개하는 단어 (words 배열의 id) — 있으면 버블 안에서 강조 표시
  highlight_word_id?: string;
}

// 프리미엄(중급~고급) 챕터 전용 — 대화 장면을 보여주고 상황을 파악하게 하는 문제
export interface DialogueTurn {
  speaker: string; // 화자 이름, 예: "선우 기장" | "손님"
  text: string;
  reading?: string;
  en?: string;
}

export interface DialogueScene {
  id: string;
  turns: DialogueTurn[];
  question: string; // 예: "이 대화는 어디에서 일어나고 있나요?"
  question_en: string;
  correct_answer: string;
  options: string[];
  explanation: string;
}

export interface ChapterContent {
  id: string; // "ch-k01"
  character_id: string;
  title: string;
  emoji: string;
  level?: "beginner" | "intermediate_advanced"; // 없으면 beginner로 취급
  story: StoryBubble[];
  words: ChapterWord[];
  sentences: ChapterSentence[];
  // intermediate_advanced 챕터에서만 사용 — 대화 장면 읽고 상황 파악하기
  dialogues?: DialogueScene[];
}
