"""Server-authoritative learning fees, rewards, and permanent story ownership."""

import secrets
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.models import Character, Economy, LessonSession, Progress, Purchase, StoryUnlock, User
from routers.progress import apply_streak, record_daily_affinity, recompute_user_level
from schemas.schemas import (
    LessonCompleteRequest, LessonCompleteResponse, LessonStartRequest, LessonStartResponse,
    StoryAccessResponse, StoryUnlockRequest, StoryUnlockResponse,
)
from services.access_control import check_character_access
from services.chapter_catalog import chapter_character_id, is_special_story
from services.wallet import change_coins, get_wallet
from services.session_auth import require_current_user, require_same_user

router = APIRouter(prefix="/learning", tags=["learning"])

LESSON_ENTRY_COST = 3
STORY_UNLOCK_COST = 5
PREMIUM_PRODUCT_ID = "kmate_premium_monthly"
MAX_LESSON_STEP_DELTA = 30


def _economy(db: Session, user_id: str) -> Economy:
    economy = db.query(Economy).filter(Economy.user_id == user_id).first()
    if not economy:
        economy = Economy(id=str(uuid.uuid4()), user_id=user_id, coins=0)
        db.add(economy)
        db.flush()
    return economy


def _has_permanent_story_pass(db: Session, user_id: str) -> bool:
    # 구독이 현재 활성화된 순간에도 즉시 열어준다. 실제 Play 검증 완료 후 Purchase가
    # 남으므로 구독이 만료된 뒤에도 아래 결제 이력 조건으로 스토리는 유지된다.
    active_user = db.query(User).filter(User.id == user_id, User.membership == "premium").first()
    if active_user:
        return True
    return db.query(Purchase.id).filter(
        Purchase.user_id == user_id,
        Purchase.product_id == PREMIUM_PRODUCT_ID,
        Purchase.status == "verified",
    ).first() is not None


def _story_access(db: Session, user_id: str, chapter_id: str) -> tuple[bool, str]:
    if _has_permanent_story_pass(db, user_id):
        return True, "premium_permanent"
    if db.query(StoryUnlock.id).filter(
        StoryUnlock.user_id == user_id, StoryUnlock.chapter_id == chapter_id
    ).first():
        return True, "coin_unlock"
    return False, "locked"


@router.get("/story-access/{user_id}/{chapter_id}", response_model=StoryAccessResponse)
def get_story_access(user_id: str, chapter_id: str, current_user_id: str = Depends(require_current_user), db: Session = Depends(get_db)):
    require_same_user(current_user_id, user_id)
    if not is_special_story(chapter_id):
        raise HTTPException(status_code=400, detail="Only special story chapters can be checked here")
    if not db.query(User.id).filter(User.id == user_id).first():
        raise HTTPException(status_code=404, detail="User not found")
    has_access, access_type = _story_access(db, user_id, chapter_id)
    return StoryAccessResponse(has_access=has_access, access_type=access_type, unlock_cost=STORY_UNLOCK_COST)


@router.post("/unlock-story", response_model=StoryUnlockResponse)
def unlock_story(req: StoryUnlockRequest, current_user_id: str = Depends(require_current_user), db: Session = Depends(get_db)):
    require_same_user(current_user_id, req.user_id)
    if not is_special_story(req.chapter_id):
        raise HTTPException(status_code=400, detail="Only special story chapters can be unlocked")
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    economy = get_wallet(db, user.id)
    has_access, access_type = _story_access(db, user.id, req.chapter_id)
    if has_access:
        return StoryUnlockResponse(has_access=True, access_type=access_type, unlock_cost=STORY_UNLOCK_COST, remaining_coins=economy.coins)
    if economy.coins < STORY_UNLOCK_COST:
        raise HTTPException(status_code=400, detail=f"코인이 부족합니다. 스토리 해금에는 {STORY_UNLOCK_COST}코인이 필요합니다.")
    economy = change_coins(db, user.id, -STORY_UNLOCK_COST, "special_story_unlock", reference_type="chapter", reference_id=req.chapter_id)
    db.add(StoryUnlock(id=str(uuid.uuid4()), user_id=user.id, chapter_id=req.chapter_id, unlock_cost=STORY_UNLOCK_COST))
    db.commit()
    return StoryUnlockResponse(has_access=True, access_type="coin_unlock", unlock_cost=STORY_UNLOCK_COST, remaining_coins=economy.coins)


@router.post("/start", response_model=LessonStartResponse)
def start_lesson(req: LessonStartRequest, current_user_id: str = Depends(require_current_user), db: Session = Depends(get_db)):
    require_same_user(current_user_id, req.user_id)
    user = db.query(User).filter(User.id == req.user_id).first()
    character = db.query(Character).filter(Character.id == req.character_id).first()
    if not user or not character:
        raise HTTPException(status_code=404, detail="User or character not found")
    owner_character_id = chapter_character_id(req.chapter_id)
    if owner_character_id is None:
        raise HTTPException(status_code=404, detail="Chapter not found")
    if owner_character_id != req.character_id:
        raise HTTPException(status_code=400, detail="Chapter does not belong to this character")
    if is_special_story(req.chapter_id):
        has_access, _ = _story_access(db, user.id, req.chapter_id)
        if not has_access:
            raise HTTPException(status_code=403, detail="스토리를 먼저 해금해주세요.")
    else:
        check_character_access(user, character)
    economy = get_wallet(db, user.id)
    is_replay = db.query(LessonSession.id).filter(
        LessonSession.user_id == user.id,
        LessonSession.chapter_id == req.chapter_id,
        LessonSession.completed.is_(True),
    ).first() is not None
    entry_cost = 0 if is_replay else LESSON_ENTRY_COST
    if economy.coins < entry_cost:
        raise HTTPException(status_code=400, detail=f"코인이 부족합니다. 학습 시작에는 {LESSON_ENTRY_COST}코인이 필요합니다.")
    session = LessonSession(
        id=str(uuid.uuid4()), user_id=user.id, character_id=character.id,
        chapter_id=req.chapter_id, entry_cost=entry_cost,
    )
    if entry_cost:
        economy = change_coins(db, user.id, -entry_cost, "lesson_entry", reference_type="lesson_session", reference_id=session.id)
    db.add(session)
    db.commit()
    return LessonStartResponse(
        session_id=session.id,
        entry_cost=entry_cost,
        remaining_coins=economy.coins,
        is_replay=is_replay,
    )


@router.post("/complete", response_model=LessonCompleteResponse)
def complete_lesson(req: LessonCompleteRequest, current_user_id: str = Depends(require_current_user), db: Session = Depends(get_db)):
    require_same_user(current_user_id, req.user_id)
    session = db.query(LessonSession).filter(
        LessonSession.id == req.session_id, LessonSession.user_id == req.user_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="학습 세션을 찾을 수 없습니다.")
    economy = get_wallet(db, req.user_id)
    prog = db.query(Progress).filter(
        Progress.user_id == req.user_id, Progress.character_id == session.character_id
    ).first()
    if not prog:
        prog = Progress(id=str(uuid.uuid4()), user_id=req.user_id, character_id=session.character_id)
        db.add(prog)
        db.flush()
    if not session.completed:
        # 원가 메모: Gemini 텍스트/음성은 학습 세션에 호출하지 않는다. 이 보상은 서버 RNG만 사용한다.
        previous_completion = db.query(LessonSession.id).filter(
            LessonSession.user_id == req.user_id,
            LessonSession.chapter_id == session.chapter_id,
            LessonSession.id != session.id,
            LessonSession.completed.is_(True),
        ).first()
        is_replay = previous_completion is not None
        session.reward_coins = 0 if is_replay else secrets.randbelow(3) + 1
        session.completed = True
        session.completed_at = datetime.now()
        if not is_replay:
            economy = change_coins(db, req.user_id, session.reward_coins, "lesson_reward", reference_type="lesson_session", reference_id=session.id)
            verified_step_delta = min(max(req.step_delta, 0), MAX_LESSON_STEP_DELTA)
            prog.current_step = max(1, prog.current_step + verified_step_delta)
            if session.chapter_id not in (prog.stamps or []):
                prog.stamps = (prog.stamps or []) + [session.chapter_id]
            record_daily_affinity(prog)
            apply_streak(prog)
        user = db.query(User).filter(User.id == req.user_id).first()
        db.flush()
        if user:
            recompute_user_level(db, user)
        db.commit()
        db.refresh(economy)
    return LessonCompleteResponse(
        reward_coins=session.reward_coins or 0,
        total_coins=economy.coins,
        stamps=prog.stamps or [],
    )
