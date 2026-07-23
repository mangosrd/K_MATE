"""
일기 라우터 — POST /diary/generate, /diary/unlock, GET /diary/{user_id}/{character_id}
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas.schemas import (
    DiaryGenerateRequest, DiaryGenerateResponse,
    DiaryUnlockRequest, DiaryUnlockResponse,
    DiaryItemResponse,
)
from services.llm_service import load_persona, llm_chat
from models.models import DiaryEntry, Economy
import uuid
from datetime import datetime

router = APIRouter(prefix="/diary", tags=["diary"])

DIARY_SYSTEM_PROMPT = """You are a Korean airline captain writing a personal flight diary entry.

Rules:
- Write EXACTLY around 100 Korean characters (한글 기준)
- Write in first person, from the captain's perspective
- Reference the flight route and landmarks below the plane
- Use warm, reflective tone — like a captain's log entry
- Include a specific moment or passenger interaction from today
- Write in Korean ONLY. No English.
- Output ONLY the diary text. No title, no date, no explanation."""


@router.post("/generate", response_model=DiaryGenerateResponse)
async def generate_diary(req: DiaryGenerateRequest, db: Session = Depends(get_db)):
    """기장 일기 생성"""
    persona = load_persona(req.character_id)

    events_text = (
        "\n".join(req.session_events) if req.session_events
        else "오늘도 승객들과 함께 한국의 하늘을 날았다."
    )

    messages = [
        {"role": "system", "content": DIARY_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Captain context:\n{persona[:400]}\n\n"
                f"Today's route: {req.place_name}\n"
                f"Today's events:\n{events_text}\n\n"
                "Write a ~100 Korean character captain's diary entry."
            ),
        },
    ]

    diary_body = await llm_chat(messages, temperature=0.85, max_tokens=256)

    diary_id = str(uuid.uuid4())
    entry = DiaryEntry(
        id=diary_id,
        user_id=req.user_id,
        character_id=req.character_id,
        body_ko=diary_body.strip(),
        place_name=req.place_name,
        unlocked=False,
        unlock_cost=req.unlock_cost,
    )
    db.add(entry)
    db.commit()

    return DiaryGenerateResponse(
        diary_id=diary_id,
        body_ko=diary_body.strip(),
        place_name=req.place_name,
        created_at=datetime.now().isoformat(),
    )


@router.post("/unlock", response_model=DiaryUnlockResponse)
def unlock_diary(req: DiaryUnlockRequest, db: Session = Depends(get_db)):
    """일기 해금 (코인 차감)"""
    entry = db.query(DiaryEntry).filter(DiaryEntry.id == req.diary_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Diary entry not found")
    if entry.unlocked:
        return DiaryUnlockResponse(success=True, remaining_coins=-1, message="이미 해금된 일기입니다")

    economy = db.query(Economy).filter(Economy.user_id == req.user_id).first()
    if not economy:
        raise HTTPException(status_code=404, detail="Economy record not found")

    if economy.coins < entry.unlock_cost:
        raise HTTPException(status_code=400, detail="코인이 부족합니다")

    economy.coins -= entry.unlock_cost
    entry.unlocked = True
    db.commit()

    return DiaryUnlockResponse(
        success=True,
        remaining_coins=economy.coins,
        message=f"일기를 해금했습니다. 잔여 코인: {economy.coins}",
    )


@router.get("/{user_id}/{character_id}", response_model=list[DiaryItemResponse])
def get_diaries(user_id: str, character_id: str, db: Session = Depends(get_db)):
    """캐릭터별 일기 목록 조회"""
    entries = (
        db.query(DiaryEntry)
        .filter(DiaryEntry.user_id == user_id, DiaryEntry.character_id == character_id)
        .order_by(DiaryEntry.created_at.desc())
        .all()
    )
    return [
        DiaryItemResponse(
            id=e.id,
            character_id=e.character_id,
            body_ko=e.body_ko,
            place_name=e.place_name or "",
            unlocked=e.unlocked,
            unlock_cost=e.unlock_cost,
            created_at=e.created_at.isoformat(),
        )
        for e in entries
    ]
