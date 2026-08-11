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
from services.access_control import check_character_access
from models.models import DiaryEntry, Economy, User, Character
from services.wallet import change_coins
from services.session_auth import require_current_user, require_same_user
import uuid
from datetime import datetime

router = APIRouter(prefix="/diary", tags=["diary"])

DIARY_SYSTEM_PROMPT = """You are a Korean airline captain writing a personal flight diary entry
about today's passenger.

Rules:
- Write EXACTLY around 100 Korean characters (한글 기준)
- Write in first person, from the captain's perspective
- Below is today's actual conversation transcript with the passenger. Read it, pick ONE real topic,
  moment, or thing the passenger said that actually came up, and write about THAT specifically —
  never write generic filler that could apply to any random day. If the transcript is empty or too
  short to find a real topic, only then fall back to a generic reflective entry about the route.
- If a passenger name is given below, address/refer to them BY THAT NAME (e.g. '민준 씨', '수아
  님') — never use generic placeholder terms like '승객', '여행자', or '그분' when a real name is
  available.
- Reference the flight route/landmarks only if they naturally fit the moment you're writing about —
  don't force them in.
- Use a warm, reflective tone — like a captain's personal log entry.
- Write in Korean ONLY. No English.
- Output ONLY the diary text. No title, no date, no explanation."""


@router.post("/generate", response_model=DiaryGenerateResponse)
async def generate_diary(req: DiaryGenerateRequest, current_user_id: str = Depends(require_current_user), db: Session = Depends(get_db)):
    require_same_user(current_user_id, req.user_id)
    """기장 일기 생성"""
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{req.user_id}' not found")
    character = db.query(Character).filter(Character.id == req.character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail=f"Character '{req.character_id}' not found")
    check_character_access(user, character)

    persona = load_persona(req.character_id)

    events_text = (
        "\n".join(req.session_events) if req.session_events
        else "(오늘은 특별히 나눈 대화가 없었다.)"
    )
    name_line = f"Passenger's name: {req.user_name}" if req.user_name else "Passenger's name: (not given — use a generic warm address instead)"

    messages = [
        {"role": "system", "content": DIARY_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Captain context:\n{persona[:400]}\n\n"
                f"Today's route: {req.place_name}\n"
                f"{name_line}\n\n"
                f"Today's conversation transcript:\n{events_text}\n\n"
                "Write a ~100 Korean character captain's diary entry about a real moment from this conversation."
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
def unlock_diary(req: DiaryUnlockRequest, current_user_id: str = Depends(require_current_user), db: Session = Depends(get_db)):
    require_same_user(current_user_id, req.user_id)
    """일기 해금 (코인 차감)"""
    entry = db.query(DiaryEntry).filter(DiaryEntry.id == req.diary_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Diary entry not found")

    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{req.user_id}' not found")
    character = db.query(Character).filter(Character.id == entry.character_id).first()
    if character:
        check_character_access(user, character)

    # with_for_update로 잠가서, 연타나 이중 요청으로 같은 유저의 두 요청이 거의 동시에
    # 들어와도 코인 차감이 한쪽만 반영되거나 잔액이 꼬이지 않게 한다.
    economy = db.query(Economy).filter(Economy.user_id == req.user_id).with_for_update().first()
    if not economy:
        raise HTTPException(status_code=404, detail="Economy record not found")

    if entry.unlocked:
        # 이미 해금된 일기를 다시 요청한 경우(연타 등) — 코인은 다시 차감하지 않되,
        # 실제 잔여 코인을 그대로 돌려줘야 한다. 예전엔 -1을 sentinel로 반환했는데,
        # 프론트에서 그 값을 그대로 코인 잔액에 표시해버려 🪙 -1이 뜨는 버그가 있었다.
        return DiaryUnlockResponse(success=True, remaining_coins=economy.coins, message="이미 해금된 일기입니다")

    if economy.coins < entry.unlock_cost:
        raise HTTPException(status_code=400, detail="코인이 부족합니다")

    economy = change_coins(db, req.user_id, -entry.unlock_cost, "diary_unlock", reference_type="diary", reference_id=entry.id)
    entry.unlocked = True
    db.commit()

    return DiaryUnlockResponse(
        success=True,
        remaining_coins=economy.coins,
        message=f"일기를 해금했습니다. 잔여 코인: {economy.coins}",
    )


@router.get("/{user_id}/{character_id}", response_model=list[DiaryItemResponse])
def get_diaries(user_id: str, character_id: str, current_user_id: str = Depends(require_current_user), db: Session = Depends(get_db)):
    require_same_user(current_user_id, user_id)
    """캐릭터별 일기 목록 조회"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{user_id}' not found")
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail=f"Character '{character_id}' not found")
    check_character_access(user, character)

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
