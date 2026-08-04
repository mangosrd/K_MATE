"""
편지 라우터 — POST /letters/send, GET /letters/{user_id}/{character_id}, POST /letters/{letter_id}/read

편지는 24시간 뒤에 답장이 온다. 답장은 보내는 시점이 아니라, 24시간이 지난 뒤 유저가
우편함을 열어볼 때(GET 호출 시점) 그 자리에서 생성한다 — 별도 백그라운드 스케줄러 없이
"다음날 답장 도착" 경험을 구현하기 위한 선택이다.
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas.schemas import LetterSendRequest, LetterSendResponse, LetterResponse
from services.llm_service import generate_letter_reply
from services.access_control import check_character_access
from models.models import Letter, Character, Economy, User
from datetime import datetime, timedelta
import uuid

router = APIRouter(prefix="/letters", tags=["letters"])

LETTER_COST = 10  # 코인 — 일기(5)보다 비싸고 사진첩 스탠딩 일러스트(15)보다 저렴
REPLY_DELAY = timedelta(hours=24)


def _to_response(letter: Letter) -> LetterResponse:
    return LetterResponse(
        id=letter.id,
        character_id=letter.character_id,
        content=letter.content,
        reply_content=letter.reply_content,
        sent_at=letter.sent_at,
        reply_ready_at=letter.reply_ready_at,
        is_read=letter.is_read,
        is_reply_ready=datetime.now() >= letter.reply_ready_at,
    )


@router.post("/send", response_model=LetterSendResponse)
def send_letter(req: LetterSendRequest, db: Session = Depends(get_db)):
    """편지지를 코인으로 구매해서 편지를 보낸다. 답장은 24시간 뒤에 생긴다."""
    character = db.query(Character).filter(Character.id == req.character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail=f"Character '{req.character_id}' not found")

    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{req.user_id}' not found")
    check_character_access(user, character)

    if not req.content.strip():
        raise HTTPException(status_code=400, detail="편지 내용을 입력해주세요.")

    # with_for_update로 잠가서 동시 요청에 의한 코인 차감 유실을 막는다(코인상점/일기/
    # 사진첩 언락과 동일한 패턴).
    economy = db.query(Economy).filter(Economy.user_id == req.user_id).with_for_update().first()
    if not economy:
        raise HTTPException(status_code=404, detail="Economy record not found")

    if economy.coins < LETTER_COST:
        raise HTTPException(status_code=400, detail="코인이 부족합니다")

    economy.coins -= LETTER_COST

    letter = Letter(
        id=str(uuid.uuid4()),
        user_id=req.user_id,
        character_id=req.character_id,
        content=req.content.strip(),
        reply_content=None,
        reply_ready_at=datetime.now() + REPLY_DELAY,
        is_read=False,
    )
    db.add(letter)
    db.commit()
    db.refresh(letter)

    return LetterSendResponse(
        success=True, letter=_to_response(letter), remaining_coins=economy.coins,
        message="편지를 보냈습니다. 내일 답장을 확인해보세요.",
    )


@router.get("/{user_id}/{character_id}", response_model=list[LetterResponse])
async def list_letters(user_id: str, character_id: str, db: Session = Depends(get_db)):
    """우편함 조회 — 답장 시간이 지났는데 아직 안 만들어진 편지는 이 시점에 생성한다."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{user_id}' not found")
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail=f"Character '{character_id}' not found")
    check_character_access(user, character)

    letters = (
        db.query(Letter)
        .filter(Letter.user_id == user_id, Letter.character_id == character_id)
        .order_by(Letter.sent_at.desc())
        .all()
    )

    now = datetime.now()
    for letter in letters:
        if letter.reply_content is None and now >= letter.reply_ready_at:
            letter.reply_content = await generate_letter_reply(character_id, letter.content)
    db.commit()

    return [_to_response(letter) for letter in letters]


@router.post("/{letter_id}/read", response_model=LetterResponse)
def mark_letter_read(letter_id: str, db: Session = Depends(get_db)):
    """답장을 읽음 처리 (우편함 안 읽은 편지 배지 표시용)"""
    letter = db.query(Letter).filter(Letter.id == letter_id).first()
    if not letter:
        raise HTTPException(status_code=404, detail="Letter not found")

    letter.is_read = True
    db.commit()
    db.refresh(letter)
    return _to_response(letter)
