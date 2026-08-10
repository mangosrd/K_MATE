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
    user_id: str
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
    # 무료 회원에게만 채워짐(몇 번 남았는지) — 프리미엄은 제한이 없어 항상 None
    free_messages_remaining: Optional[int] = None
    coins_spent: int = 0
    remaining_coins: Optional[int] = None


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
    user_name: Optional[str] = None
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
    add_places: List[str] = []
    add_stamp: Optional[str] = None


# ── 학습 경제 ──────────────────────────────────────────────
class LessonStartRequest(BaseModel):
    user_id: str
    character_id: str
    chapter_id: str


class LessonStartResponse(BaseModel):
    session_id: str
    entry_cost: int
    remaining_coins: int


class LessonCompleteRequest(BaseModel):
    user_id: str
    session_id: str
    step_delta: int = 0
    add_stamp: Optional[str] = None


class LessonCompleteResponse(BaseModel):
    reward_coins: int
    total_coins: int
    stamps: List[str]


class StoryAccessResponse(BaseModel):
    has_access: bool
    access_type: Literal["premium_permanent", "coin_unlock", "locked"]
    unlock_cost: int = 5


class StoryUnlockRequest(BaseModel):
    user_id: str
    chapter_id: str


class StoryUnlockResponse(StoryAccessResponse):
    remaining_coins: int


class PremiumStoryItemResponse(BaseModel):
    id: str
    character_id: str
    episode_number: int
    title: str
    summary: str
    body: Optional[str] = None
    unlock_cost: int
    unlocked: bool


class PremiumStoryUnlockRequest(BaseModel):
    user_id: str


class PremiumStoryUnlockResponse(BaseModel):
    success: bool
    remaining_coins: int
    story: PremiumStoryItemResponse


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
    ad_watches_remaining: int


# ── 인증 ──────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthUserResponse(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    language: str
    membership: str
    access_token: str


class WithdrawRequest(BaseModel):
    user_id: str
    password: str


class WithdrawResponse(BaseModel):
    success: bool
    message: str


# ── 계정 설정 (개인정보/비밀번호/알림/테마) ───────────────────
class ProfileUpdateRequest(BaseModel):
    user_id: str
    name: str
    email: str


class ChangePasswordRequest(BaseModel):
    user_id: str
    current_password: str
    new_password: str


class SimpleSuccessResponse(BaseModel):
    success: bool
    message: str


class PreferencesResponse(BaseModel):
    theme_pref: str
    notify_chat: bool
    notify_diary: bool
    notify_marketing: bool


class PreferencesUpdateRequest(BaseModel):
    user_id: str
    theme_pref: Optional[Literal["light", "dark"]] = None
    notify_chat: Optional[bool] = None
    notify_diary: Optional[bool] = None
    notify_marketing: Optional[bool] = None


class PushDeviceRegisterRequest(BaseModel):
    token: str = Field(..., min_length=20, max_length=255)
    platform: Literal["android"] = "android"


class PushDeviceRemoveRequest(BaseModel):
    token: str = Field(..., min_length=20, max_length=255)


class PushDeviceResponse(BaseModel):
    success: bool


# ── 결제 수단 (시뮬레이션 — 카드 전체 번호는 저장하지 않음) ────
class PaymentMethodResponse(BaseModel):
    id: str
    brand: str
    last4: str
    created_at: str


class PaymentMethodCreateRequest(BaseModel):
    user_id: str
    card_number: str = Field(..., min_length=12, max_length=19)


# ── 고객 지원 ────────────────────────────────────────────────
class SupportTicketRequest(BaseModel):
    user_id: Optional[str] = None
    name: str
    email: str
    category: Literal["account", "billing", "bug", "content", "other"] = "other"
    message: str = Field(..., min_length=5, max_length=2000)


class SupportTicketResponse(BaseModel):
    success: bool
    ticket_id: str


# ── 기장 사진첩 (코인으로 해금하는 스탠딩 일러스트) ────────────
class GalleryImageResponse(BaseModel):
    id: str
    image_url: str
    title: Optional[str] = None
    order: int
    unlock_cost: int
    unlocked: bool


class GalleryUnlockRequest(BaseModel):
    user_id: str
    image_id: str


class GalleryUnlockResponse(BaseModel):
    success: bool
    remaining_coins: int
    message: str


# ── 번역 (챕터 콘텐츠용 온디맨드 번역, LLM + 캐시) ─────────────
class TranslateItem(BaseModel):
    text: str
    # 원본 한국어(단어 또는 예문) — 영어 글로스만 단독으로 번역하면 의미가 모호해서
    # (예: "Rumor" 단독으로는 속어로 오역되기 쉬움) 문맥으로 함께 넘긴다.
    context_ko: Optional[str] = None


class TranslateRequest(BaseModel):
    texts: List[str] = []
    items: Optional[List[TranslateItem]] = None
    target_lang: str


class TranslateResponse(BaseModel):
    translations: List[str]


# ── 결제 (안드로이드 앱 = Google Play 인앱결제) ─────────────────
class AndroidPurchaseVerifyRequest(BaseModel):
    user_id: str
    product_id: str
    purchase_token: str


class PortonePaymentVerifyRequest(BaseModel):
    user_id: str
    payment_id: str
    product_id: Optional[str] = None  # 프리미엄 구독 검증엔 상품 구분이 없어 생략 가능


class PurchaseVerifyResponse(BaseModel):
    success: bool
    membership: str
    message: str


class CoinPack(BaseModel):
    product_id: str
    coins: int
    price_krw: int
    label: str


class CoinPurchaseResponse(BaseModel):
    success: bool
    coins_granted: int
    total_coins: int


class WatchAdRequest(BaseModel):
    user_id: str


class WatchAdResponse(BaseModel):
    success: bool
    coins_granted: int
    total_coins: int
    watches_remaining: int
    message: str


class CharacterPack(BaseModel):
    product_id: str
    character_id: str
    price_krw: int
    label: str


class CharacterPurchaseResponse(BaseModel):
    success: bool
    character_id: str
    free_char_slots: List[str]
    message: str


# ── 편지 (지연 답장) ─────────────────────────────────────────
class LetterSendRequest(BaseModel):
    user_id: str
    character_id: str
    content: str


class LetterResponse(BaseModel):
    id: str
    character_id: str
    content: str
    reply_content: Optional[str] = None
    sent_at: datetime
    reply_ready_at: datetime
    is_read: bool
    is_reply_ready: bool


class LetterSendResponse(BaseModel):
    success: bool
    letter: Optional[LetterResponse] = None
    remaining_coins: int
    message: str


# ── 헬스체크 ──────────────────────────────────────────────
class HealthResponse(BaseModel):
    status: str
    db_connected: bool
    version: str = "1.0.0"
