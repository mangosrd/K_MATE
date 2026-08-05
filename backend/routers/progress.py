"""
진도·권역·사용자 라우터
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from schemas.schemas import (
    ProgressResponse, ProgressUpdate,
    RegionResponse, CharacterResponse, UserResponse
)
from models.models import Progress, Region, Character, User, Economy
from routers.billing import require_internal_secret
from services.access_control import check_character_access
from services.ads import get_ad_watches_remaining
from datetime import datetime, timedelta
import uuid

router = APIRouter(tags=["progress"])


def record_daily_affinity(prog: Progress) -> None:
    """Keep relationship progress to one point per captain per calendar day."""
    today = datetime.now().date()
    last_date = prog.last_active_at.date() if prog.last_active_at else None
    if last_date != today or prog.affinity == 0:
        prog.affinity = min(100, prog.affinity + 1)
    prog.last_active_at = datetime.now()


def apply_streak(prog: Progress) -> None:
    """오늘 활동을 기준으로 연속 일수(streak_days)와 호감도(affinity)를 함께 갱신한다.

    연속 일수: 오늘 이미 활동했으면 그대로, 어제까지 활동했으면 +1, 그보다 오래됐으면 1로 리셋.
    호감도: 하루 중 몇 번을 대화하거나 챕터를 몇 개를 깨든 그날의 "최초 활동"에만 +1 한다 —
    예전엔 채팅 메시지 하나마다 무조건 +1이라, 메시지를 많이 보내면 호감도가 하루 만에도
    수십씩 뛰어버렸다. 연속 일수와 똑같이 "하루에 1"로 게이트를 맞춘다.
    채팅(chat.py)과 챕터 완료(update_progress) 양쪽에서 공유해서 쓴다.
    """
    today = datetime.now().date()
    last_date = prog.last_study_at.date() if prog.last_study_at else None

    if prog.streak_days == 0:
        # 이 캐릭터와 처음 활동하는 날 (last_active_at이 server_default로 이미 채워져
        # 있어도 streak_days는 아직 0이므로 여기서 확실히 1로 시작한다)
        prog.streak_days = 1
    elif last_date == today:
        pass
    elif last_date == today - timedelta(days=1):
        prog.streak_days += 1
    else:
        prog.streak_days = 1

    prog.last_study_at = datetime.now()


# ── 레벨 ──────────────────────────────────────────────────
# 예전엔 users.level이 DB 컬럼으로는 존재했지만 아무 로직도 값을 갱신하지 않아서
# 항상 기본값(1)에 멈춰 있었고, 프론트도 실제 값 대신 목업(MOCK_USER.level)을
# 그대로 보여주고 있었다. 챕터를 풀 때마다 쌓이는 progress.current_step(퀴즈 문항당
# +10, 챕터당 대략 +100)을 캐릭터 전체에 걸쳐 합산한 걸 "누적 경험치"로 삼아 레벨을
# 계산한다 — 새로운 카운터를 추가하지 않고 이미 쌓이고 있던 값을 그대로 재활용한다.
XP_PER_LEVEL = 200


def compute_level(total_xp: int) -> int:
    return 1 + max(0, total_xp) // XP_PER_LEVEL


def recompute_user_level(db: Session, user: User) -> None:
    total_xp = (
        db.query(func.sum(Progress.current_step))
        .filter(Progress.user_id == user.id)
        .scalar()
    ) or 0
    user.level = compute_level(total_xp)


# ── 진도 ──────────────────────────────────────────────────
@router.get("/progress/{user_id}/{character_id}", response_model=ProgressResponse)
def get_progress(user_id: str, character_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{user_id}' not found")
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail=f"Character '{character_id}' not found")
    check_character_access(user, character)

    prog = (
        db.query(Progress)
        .filter(Progress.user_id == user_id, Progress.character_id == character_id)
        .first()
    )
    if not prog:
        # 새 진도 생성
        prog = Progress(
            id=str(uuid.uuid4()),
            user_id=user_id,
            character_id=character_id,
        )
        db.add(prog)
        db.commit()
        db.refresh(prog)

    return ProgressResponse(
        character_id=prog.character_id,
        affinity=prog.affinity,
        current_step=prog.current_step,
        streak_days=prog.streak_days,
        visited_places=prog.visited_places or [],
        stamps=prog.stamps or [],
    )


@router.put("/progress", response_model=ProgressResponse)
def update_progress(req: ProgressUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{req.user_id}' not found")
    character = db.query(Character).filter(Character.id == req.character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail=f"Character '{req.character_id}' not found")
    check_character_access(user, character)

    prog = (
        db.query(Progress)
        .filter(Progress.user_id == req.user_id, Progress.character_id == req.character_id)
        .first()
    )
    if not prog:
        # GET과 동일하게, 아직 진도 기록이 없으면 새로 만든다 (첫 챕터 완료 시에도 안전하게 기록되도록)
        prog = Progress(id=str(uuid.uuid4()), user_id=req.user_id, character_id=req.character_id)
        db.add(prog)
        db.flush()

    prog.affinity = min(100, max(0, prog.affinity + req.affinity_delta))
    prog.current_step = max(1, prog.current_step + req.step_delta)

    new_places = list(req.add_places)
    if req.add_place:
        new_places.append(req.add_place)
    if new_places:
        visited = prog.visited_places or []
        prog.visited_places = visited + [p for p in new_places if p not in visited]

    if req.add_stamp and req.add_stamp not in (prog.stamps or []):
        prog.stamps = (prog.stamps or []) + [req.add_stamp]
    record_daily_affinity(prog)
    apply_streak(prog)

    # 레벨 재계산 — autoflush가 꺼져 있어서(database.py) 방금 바뀐 current_step이
    # 아래 합계 쿼리에 아직 안 보일 수 있으니 먼저 flush로 반영해둔다.
    db.flush()
    recompute_user_level(db, user)

    db.commit()
    db.refresh(prog)

    return ProgressResponse(
        character_id=prog.character_id,
        affinity=prog.affinity,
        current_step=prog.current_step,
        streak_days=prog.streak_days,
        visited_places=prog.visited_places or [],
        stamps=prog.stamps or [],
    )


# ── 권역 ──────────────────────────────────────────────────
@router.get("/regions", response_model=list[RegionResponse])
def get_regions(db: Session = Depends(get_db)):
    regions = db.query(Region).all()
    return [
        RegionResponse(
            id=r.id, name=r.name, name_en=r.name_en,
            airport_code=r.airport_code,
            description=r.description or "", description_en=r.description_en or "",
            place_count=r.place_count, is_locked=r.is_locked,
            characters=[
                CharacterResponse(
                    id=c.id, region_id=c.region_id, name=c.name,
                    emoji=c.emoji or "", description=c.description or "",
                    description_en=c.description_en or "",
                    tags=c.tags or [], requires_premium=c.requires_premium,
                )
                for c in r.characters
            ],
        )
        for r in regions
    ]


@router.get("/region/{region_id}/characters", response_model=list[CharacterResponse])
def get_region_characters(region_id: str, db: Session = Depends(get_db)):
    chars = db.query(Character).filter(Character.region_id == region_id).all()
    return [
        CharacterResponse(
            id=c.id, region_id=c.region_id, name=c.name,
            emoji=c.emoji or "", description=c.description or "",
            description_en=c.description_en or "",
            tags=c.tags or [], requires_premium=c.requires_premium,
        )
        for c in chars
    ]


# ── 사용자 ────────────────────────────────────────────────
@router.get("/user/{user_id}", response_model=UserResponse)
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    economy = db.query(Economy).filter(Economy.user_id == user_id).first()
    return UserResponse(
        id=user.id, name=user.name, language=user.language,
        level=user.level, membership=user.membership,
        free_char_slots=user.free_char_slots or [],
        coins=economy.coins if economy else 0,
        ad_watches_remaining=get_ad_watches_remaining(db, user),
    )


@router.put("/user/{user_id}/membership", response_model=UserResponse, dependencies=[Depends(require_internal_secret)])
def upgrade_membership(user_id: str, db: Session = Depends(get_db)):
    """프리미엄 구독 시작 (결제 연동 전 시뮬레이션 — 무료 체험 시작과 동일하게 즉시 업그레이드)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.membership = "premium"
    db.commit()
    db.refresh(user)

    economy = db.query(Economy).filter(Economy.user_id == user_id).first()
    return UserResponse(
        id=user.id, name=user.name, language=user.language,
        level=user.level, membership=user.membership,
        free_char_slots=user.free_char_slots or [],
        coins=economy.coins if economy else 0,
        ad_watches_remaining=get_ad_watches_remaining(db, user),
    )
