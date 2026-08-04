"""
K-MATE SQLAlchemy ORM 모델 (MySQL)
"""

from sqlalchemy import (
    Column, String, Integer, Boolean, Text, DateTime, Date, Enum,
    ForeignKey, JSON, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


# ── Enum 타입 ─────────────────────────────────────────────
class MembershipEnum(str, enum.Enum):
    free = "free"
    premium = "premium"

class MasteryEnum(str, enum.Enum):
    new = "new"
    learning = "learning"
    reviewing = "reviewing"
    mastered = "mastered"

class MemoryTypeEnum(str, enum.Enum):
    fact = "fact"
    preference = "preference"
    progress = "progress"
    emotion = "emotion"


# ── 사용자 ────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id              = Column(String(36), primary_key=True)
    name            = Column(String(100), nullable=False)
    email           = Column(String(255), unique=True)
    password_hash   = Column(String(255))
    language        = Column(String(10), default="en", nullable=False)
    level           = Column(Integer, default=1, nullable=False)
    membership      = Column(Enum(MembershipEnum), default="free", nullable=False)
    free_char_slots = Column(JSON, default=list)
    # 무료 회원 채팅 횟수 — 계정에 귀속되므로 재접속/로그아웃해도 초기화 안 됨.
    # 프리미엄(membership=premium)이면 이 값은 아예 검사하지 않는다.
    free_chat_count = Column(Integer, default=0, nullable=False)
    # 광고 시청 보상 코인 — 하루 최대 100코인(광고 20회)까지, 매일(ad_coins_date 기준) 초기화.
    # 별도 배치/크론 없이, 조회·지급 시점에 오늘 날짜와 다르면 그 자리에서 리셋하는
    # 방식(services/ads.py)을 쓴다.
    ad_coins_today = Column(Integer, default=0, nullable=False)
    ad_coins_date  = Column(Date, nullable=True)
    theme_pref        = Column(String(10), default="light", nullable=False)
    notify_chat       = Column(Boolean, default=True, nullable=False)
    notify_diary      = Column(Boolean, default=True, nullable=False)
    notify_marketing  = Column(Boolean, default=False, nullable=False)
    is_withdrawn    = Column(Boolean, default=False, nullable=False)
    withdrawn_at    = Column(DateTime, nullable=True)
    created_at      = Column(DateTime, server_default=func.now())
    updated_at      = Column(DateTime, server_default=func.now(), onupdate=func.now())

    progress        = relationship("Progress", back_populates="user")
    memories        = relationship("Memory", back_populates="user")
    diaries         = relationship("DiaryEntry", back_populates="user")
    vocab_items     = relationship("VocabItem", back_populates="user")
    economy         = relationship("Economy", back_populates="user", uselist=False)
    payment_methods = relationship("PaymentMethod", back_populates="user")
    letters         = relationship("Letter", back_populates="user")


# ── 권역 ──────────────────────────────────────────────────
class Region(Base):
    __tablename__ = "regions"

    id             = Column(String(50), primary_key=True)
    name           = Column(String(100), nullable=False)
    name_en        = Column(String(100), nullable=False)
    airport_code   = Column(String(5), nullable=False)
    description    = Column(Text)
    description_en = Column(Text)
    place_count    = Column(Integer, default=0)
    is_locked      = Column(Boolean, default=True)
    created_at     = Column(DateTime, server_default=func.now())

    characters = relationship("Character", back_populates="region")


# ── 캐릭터 ────────────────────────────────────────────────
class Character(Base):
    __tablename__ = "characters"

    id               = Column(String(50), primary_key=True)
    region_id        = Column(String(50), ForeignKey("regions.id"), nullable=False)
    name             = Column(String(50), nullable=False)
    emoji            = Column(String(10))
    description      = Column(Text)
    description_en   = Column(Text)
    tags             = Column(JSON, default=list)
    persona          = Column(Text)
    requires_premium = Column(Boolean, default=False)
    created_at       = Column(DateTime, server_default=func.now())

    region      = relationship("Region", back_populates="characters")
    progress    = relationship("Progress", back_populates="character")
    memories    = relationship("Memory", back_populates="character")
    diaries     = relationship("DiaryEntry", back_populates="character")
    vocab_items = relationship("VocabItem", back_populates="character")
    letters     = relationship("Letter", back_populates="character")


# ── 진도 ──────────────────────────────────────────────────
class Progress(Base):
    __tablename__ = "progress"
    __table_args__ = (UniqueConstraint("user_id", "character_id"),)

    id             = Column(String(36), primary_key=True)
    user_id        = Column(String(36), ForeignKey("users.id"), nullable=False)
    character_id   = Column(String(50), ForeignKey("characters.id"), nullable=False)
    affinity       = Column(Integer, default=0, nullable=False)
    stamps         = Column(JSON, default=list)
    current_step   = Column(Integer, default=1, nullable=False)
    visited_places = Column(JSON, default=list)
    streak_days    = Column(Integer, default=0, nullable=False)
    last_active_at = Column(DateTime, server_default=func.now())

    user      = relationship("User", back_populates="progress")
    character = relationship("Character", back_populates="progress")


# ── 기억 ──────────────────────────────────────────────────
class Memory(Base):
    __tablename__ = "memories"

    id           = Column(String(36), primary_key=True)
    user_id      = Column(String(36), ForeignKey("users.id"), nullable=False)
    character_id = Column(String(50), ForeignKey("characters.id"), nullable=False)
    type         = Column(Enum(MemoryTypeEnum), nullable=False)
    content      = Column(Text, nullable=False)
    created_at   = Column(DateTime, server_default=func.now())

    user      = relationship("User", back_populates="memories")
    character = relationship("Character", back_populates="memories")


# ── 일기 ──────────────────────────────────────────────────
class DiaryEntry(Base):
    __tablename__ = "diary_entries"

    id           = Column(String(36), primary_key=True)
    user_id      = Column(String(36), ForeignKey("users.id"), nullable=False)
    character_id = Column(String(50), ForeignKey("characters.id"), nullable=False)
    body_ko      = Column(Text, nullable=False)
    place_name   = Column(String(200))
    unlocked     = Column(Boolean, default=False, nullable=False)
    unlock_cost  = Column(Integer, default=5, nullable=False)
    created_at   = Column(DateTime, server_default=func.now())

    user      = relationship("User", back_populates="diaries")
    character = relationship("Character", back_populates="diaries")


# ── 편지 (지연 답장) ──────────────────────────────────────
# 답장은 보내는 즉시 만들지 않는다 — reply_ready_at이 지난 뒤 유저가 우편함을 열어볼 때
# 그 시점에 생성한다(백그라운드 스케줄러 없이도 "다음날 답장 도착" 느낌을 구현하기 위함).
class Letter(Base):
    __tablename__ = "letters"

    id              = Column(String(36), primary_key=True)
    user_id         = Column(String(36), ForeignKey("users.id"), nullable=False)
    character_id    = Column(String(50), ForeignKey("characters.id"), nullable=False)
    content         = Column(Text, nullable=False)
    reply_content   = Column(Text, nullable=True)
    sent_at         = Column(DateTime, server_default=func.now())
    reply_ready_at  = Column(DateTime, nullable=False)
    is_read         = Column(Boolean, default=False, nullable=False)

    user      = relationship("User", back_populates="letters")
    character = relationship("Character", back_populates="letters")


# ── 단어장 ────────────────────────────────────────────────
class VocabItem(Base):
    __tablename__ = "vocab_items"

    id                   = Column(String(36), primary_key=True)
    user_id              = Column(String(36), ForeignKey("users.id"), nullable=False)
    character_id         = Column(String(50), ForeignKey("characters.id"), nullable=False)
    region_id            = Column(String(50))
    word                 = Column(String(100), nullable=False)
    reading              = Column(String(200))
    meaning              = Column(String(500), nullable=False)
    sentence             = Column(Text)
    sentence_translation = Column(Text)
    mastery              = Column(Enum(MasteryEnum), default="new", nullable=False)
    tags                 = Column(JSON, default=list)
    last_reviewed_at     = Column(DateTime)
    review_count         = Column(Integer, default=0, nullable=False)
    created_at           = Column(DateTime, server_default=func.now())

    user      = relationship("User", back_populates="vocab_items")
    character = relationship("Character", back_populates="vocab_items")


# ── 경제 ──────────────────────────────────────────────────
class Economy(Base):
    __tablename__ = "economies"

    id         = Column(String(36), primary_key=True)
    user_id    = Column(String(36), ForeignKey("users.id"), nullable=False, unique=True)
    coins      = Column(Integer, default=0, nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="economy")


# ── 멤버십 ────────────────────────────────────────────────
class Membership(Base):
    __tablename__ = "memberships"

    id         = Column(String(36), primary_key=True)
    user_id    = Column(String(36), ForeignKey("users.id"), nullable=False, unique=True)
    tier       = Column(Enum(MembershipEnum), default="free", nullable=False)
    started_at = Column(DateTime, server_default=func.now())
    expires_at = Column(DateTime, nullable=True)
    price_krw  = Column(Integer, default=0)


# ── 결제 수단 ──────────────────────────────────────────────
# 실제 카드사 연동 없이(프리미엄 구독 자체가 /user/{id}/membership 즉시 전환 시뮬레이션이므로)
# 등록된 카드처럼 보여줄 브랜드/끝 4자리만 저장한다. 실제 카드번호 전체는 절대 저장하지 않는다.
class PaymentMethod(Base):
    __tablename__ = "payment_methods"

    id         = Column(String(36), primary_key=True)
    user_id    = Column(String(36), ForeignKey("users.id"), nullable=False)
    brand      = Column(String(20), nullable=False)
    last4      = Column(String(4), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="payment_methods")


# ── 결제 내역 (실제 결제 검증 기록) ──────────────────────────
# 웹은 포트원(국내), 안드로이드 앱은 Google Play 인앱결제(해외 포함 전체) —
# platform으로 어느 경로로 결제됐는지 구분한다. purchase_token은 Google Play
# 영수증 토큰으로, 같은 결제가 두 번 반영되지 않도록 유니크 제약을 건다.
class Purchase(Base):
    __tablename__ = "purchases"

    id              = Column(String(36), primary_key=True)
    user_id         = Column(String(36), ForeignKey("users.id"), nullable=False)
    platform        = Column(String(20), nullable=False)  # "google_play" | "portone"
    product_id      = Column(String(100), nullable=False)
    purchase_token  = Column(String(500), nullable=False)
    status          = Column(String(20), nullable=False, default="verified")
    created_at      = Column(DateTime, server_default=func.now())

    __table_args__ = (UniqueConstraint("platform", "purchase_token", name="uq_purchase_token"),)


# ── 고객 지원 문의 ────────────────────────────────────────
class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id         = Column(String(36), primary_key=True)
    user_id    = Column(String(36), ForeignKey("users.id"), nullable=True)
    name       = Column(String(100), nullable=False)
    email      = Column(String(255), nullable=False)
    category   = Column(String(50), nullable=False)
    message    = Column(Text, nullable=False)
    status     = Column(String(20), default="open", nullable=False)
    created_at = Column(DateTime, server_default=func.now())


# ── 번역 캐시 ─────────────────────────────────────────────
# 챕터 콘텐츠(단어 뜻/예문 번역 등)는 한국어+영어로만 작성돼 있어, UI 언어가 그 외
# 언어(러시아어/중국어/일본어/태국어 등)일 때 화면에 영어가 그대로 노출되는 문제가 있었다.
# 수백 개 단어를 언어마다 전부 미리 번역해두는 대신, 처음 조회될 때 LLM으로 번역해서
# 이 테이블에 캐싱한다 — 같은 텍스트+언어 조합은 두 번째부터 DB 조회만으로 즉시 응답된다.
class TranslationCache(Base):
    __tablename__ = "translation_cache"
    __table_args__ = (UniqueConstraint("text_hash", "target_lang"),)

    id              = Column(String(36), primary_key=True)
    text_hash       = Column(String(64), nullable=False)
    target_lang     = Column(String(10), nullable=False)
    source_text     = Column(Text, nullable=False)
    translated_text = Column(Text, nullable=False)
    created_at      = Column(DateTime, server_default=func.now())


# ── 기장 사진첩 ────────────────────────────────────────────
# 캐릭터별 스탠딩 일러스트 카탈로그(모든 유저 공통, 관리자가 시드) + 유저별 해금 여부.
# 일기 해금(diary_entries.unlocked + Economy 코인 차감)과 동일한 방식으로, 이미지 자체는
# 정적 파일(public/gallery/{character_id}/...)이고 DB에는 잠금 여부/가격 메타데이터만 둔다.
class GalleryImage(Base):
    __tablename__ = "gallery_images"

    id          = Column(String(36), primary_key=True)
    character_id = Column(String(50), ForeignKey("characters.id"), nullable=False)
    image_url   = Column(String(255), nullable=False)
    title       = Column(String(100))
    order       = Column(Integer, default=0, nullable=False)
    unlock_cost = Column(Integer, default=0, nullable=False)  # 0이면 항상 무료 공개
    created_at  = Column(DateTime, server_default=func.now())


class UserGalleryUnlock(Base):
    __tablename__ = "user_gallery_unlocks"
    __table_args__ = (UniqueConstraint("user_id", "image_id"),)

    id         = Column(String(36), primary_key=True)
    user_id    = Column(String(36), ForeignKey("users.id"), nullable=False)
    image_id   = Column(String(36), ForeignKey("gallery_images.id"), nullable=False)
    unlocked_at = Column(DateTime, server_default=func.now())
