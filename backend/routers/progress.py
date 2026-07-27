"""
진도·권역·사용자 라우터
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.schemas import (
    ProgressResponse, ProgressUpdate,
    RegionResponse, CharacterResponse, UserResponse
)
from models.models import Progress, Region, Character, User, Economy
import uuid

router = APIRouter(tags=["progress"])


# ── 진도 ──────────────────────────────────────────────────
@router.get("/progress/{user_id}/{character_id}", response_model=ProgressResponse)
def get_progress(user_id: str, character_id: str, db: Session = Depends(get_db)):
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
    if req.add_place and req.add_place not in (prog.visited_places or []):
        prog.visited_places = (prog.visited_places or []) + [req.add_place]
    if req.add_stamp and req.add_stamp not in (prog.stamps or []):
        prog.stamps = (prog.stamps or []) + [req.add_stamp]
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
    )
