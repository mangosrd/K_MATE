"""
K-MATE SQLAlchemy ORM 모델 (MySQL)
"""

from sqlalchemy import (
    Column, String, Integer, Boolean, Text, DateTime, Enum,
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
    language        = Column(String(10), default="en", nullable=False)
    level           = Column(Integer, default=1, nullable=False)
    membership      = Column(Enum(MembershipEnum), default="free", nullable=False)
    free_char_slots = Column(JSON, default=list)
    created_at      = Column(DateTime, server_default=func.now())
    updated_at      = Column(DateTime, server_default=func.now(), onupdate=func.now())

    progress    = relationship("Progress", back_populates="user")
    memories    = relationship("Memory", back_populates="user")
    diaries     = relationship("DiaryEntry", back_populates="user")
    vocab_items = relationship("VocabItem", back_populates="user")
    economy     = relationship("Economy", back_populates="user", uselist=False)


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
