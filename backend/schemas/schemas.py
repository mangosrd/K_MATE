"""
K-MATE Pydantic 스키마 (요청/응답 모델)
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime


# ── 공통 ──────────────────────────────────────────────────
class MessageItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str


# ── 채팅 ──────────────────────────────────────────────────
class ChatRequest(BaseModel):
    character_id: str
    user_message: str
    session_history: List[MessageItem] = []
    user_id: str = "user-001"
    place_id: Optional[str] = None
    user_language: str = "en"


class WordSuggestion(BaseModel):
    word: str
    meaning: str
    sentence: str
    level: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    callback_memory: Optional[str] = None
    word_suggestion: Optional[WordSuggestion] = None
    affinity_delta: int = 1


# ── 기억 ──────────────────────────────────────────────────
class MemoryItem(BaseModel):
    type: Literal["fact", "preference", "progress", "emotion"] = "fact"
    content: str


class MemoryCreateRequest(BaseModel):
    user_id: str
    character_id: str
    memories: List[MemoryItem] = []


class MemoryResponse(BaseModel):
    id: str
    character_id: str
    type: str
    content: str
    created_at: str


class MemoryCreateResponse(BaseModel):
    saved_memories: List[MemoryResponse]


# ── 일기 ──────────────────────────────────────────────────
class DiaryGenerateRequest(BaseModel):
    user_id: str
    character_id: str
    session_events: List[str] = []
    place_name: str = "한국 여행"
    unlock_cost: int = 5


class DiaryGenerateResponse(BaseModel):
    diary_id: str
    body_ko: str
    place_name: str
    created_at: str


class DiaryUnlockRequest(BaseModel):
    user_id: str
    diary_id: str
    method: Literal["coin", "premium"] = "coin"


class DiaryUnlockResponse(BaseModel):
    success: bool
    remaining_coins: int
    message: str


class DiaryItemResponse(BaseModel):
    id: str
    character_id: str
    body_ko: str
    place_name: str
    unlocked: bool
    unlock_cost: int
    created_at: str


# ── 단어장 ────────────────────────────────────────────────
class VocabItemCreate(BaseModel):
    user_id: str
    character_id: str
    region_id: Optional[str] = None
    word: str
    reading: Optional[str] = None
    meaning: str
    sentence: Optional[str] = None
    sentence_translation: Optional[str] = None
    tags: List[str] = []


class VocabItemResponse(BaseModel):
    id: str
    character_id: str
    region_id: Optional[str]
    word: str
    reading: Optional[str]
    meaning: str
    sentence: Optional[str]
    sentence_translation: Optional[str]
    mastery: str
    tags: List[str]
    review_count: int
    last_reviewed_at: Optional[str]


class VocabReviewUpdate(BaseModel):
    user_id: str
    vocab_id: str
    mastery: Literal["new", "learning", "reviewing", "mastered"]


# ── 진도 ──────────────────────────────────────────────────
class ProgressResponse(BaseModel):
    character_id: str
    affinity: int
    current_step: int
    streak_days: int
    visited_places: List[str]
    stamps: List[str]


class ProgressUpdate(BaseModel):
    user_id: str
    character_id: str
    affinity_delta: int = 0
    step_delta: int = 0
    add_place: Optional[str] = None
    add_stamp: Optional[str] = None


# ── 캐릭터 ────────────────────────────────────────────────
class CharacterResponse(BaseModel):
    id: str
    region_id: str
    name: str
    emoji: str
    description: str
    description_en: str
    tags: List[str]
    requires_premium: bool


# ── 권역 ──────────────────────────────────────────────────
class RegionResponse(BaseModel):
    id: str
    name: str
    name_en: str
    airport_code: str
    description: str
    description_en: str
    place_count: int
    is_locked: bool
    characters: List[CharacterResponse] = []


# ── 사용자 ────────────────────────────────────────────────
class UserResponse(BaseModel):
    id: str
    name: str
    language: str
    level: int
    membership: str
    free_char_slots: List[str]
    coins: int


# ── 헬스체크 ──────────────────────────────────────────────
class HealthResponse(BaseModel):
    status: str
    db_connected: bool
    version: str = "1.0.0"
