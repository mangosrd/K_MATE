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
from services.session_auth import require_current_user, require_same_user
from models.models import Letter, Character, Economy, User
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
import uuid

router = APIRouter(prefix="/letters", tags=["letters"])

LETTER_COST = 10  # 코인 — 일기(5)보다 비싸고 사진첩 스탠딩 일러스트(15)보다 저렴
REPLY_DELAY = timedelta(hours=24)
KST = ZoneInfo("Asia/Seoul")


def _today_kst_bounds_as_utc() -> tuple[datetime, datetime]:
    """Return the current Korean calendar day as UTC-naive database bounds."""
    now_kst = datetime.now(KST)
    start_kst = now_kst.replace(hour=0, minute=0, second=0, microsecond=0)
    end_kst = start_kst + timedelta(days=1)
    return (
        start_kst.astimezone(timezone.utc).replace(tzinfo=None),
        end_kst.astimezone(timezone.utc).replace(tzinfo=None),
    )


def _fallback_letter_reply(character_id: str) -> str:
    """A character-specific reply used only when the AI provider is unavailable."""
    replies = {
        "kyuhyun": "아가씨가 남긴 편지, 비행 끝나고 천천히 읽었어요. 괜히 몇 번이나 다시 보게 되네. 다음 편지도 기다리고 있을게요. — 규현",
        "haneul": "편지 잘 읽었어요. 당신이 말한 그 하루, 생각보다 오래 남네요. 다음엔 너무 혼자 끌어안지 말고 조금 더 적어줘요. — 하늘",
        "sunwoo": "야, 편지 너무 진지한 거 아이가. 읽고 괜히 내가 더 말 많아질 뻔했네. 다음엔 직접도 좀 들려줘라. — 선우",
        "sangwoo": "타워, 편지 수신 완료했습니다. 남겨 준 마음은 안전하게 보관하겠습니다. 다음 교신도 기다리고 있겠습니다. — 상우",
        "yongwoo": "편지 잘 받았다. 네가 적어 준 얘기, 내가 챙겨 봤으니까 너무 걱정하지 마. 다음엔 네 얘기 조금 더 자세히 들려줘. — 용우",
    }
    return replies.get(character_id, "편지 잘 읽었습니다. 다음 편지도 기다리고 있을게요.")


async def _generate_reply_or_fallback(character_id: str, content: str) -> str:
    """Retry once, then deliver a safe in-character reply instead of leaving mail pending forever."""
    for _ in range(2):
        try:
            reply = (await generate_letter_reply(character_id, content)).strip()
            if reply:
                return reply
        except Exception as exc:
            print(f"[letters] reply generation failed for {character_id}: {type(exc).__name__}", flush=True)
    return _fallback_letter_reply(character_id)


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
def send_letter(req: LetterSendRequest, current_user_id: str = Depends(require_current_user), db: Session = Depends(get_db)):
    """편지지를 코인으로 구매해서 편지를 보낸다. 답장은 24시간 뒤에 생긴다."""
    require_same_user(current_user_id, req.user_id)
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

    # 기장님별로 한국 시간 기준 하루 한 번만 보낼 수 있다. 경제 행 잠금 뒤에
    # 검사하므로 동시에 두 번 눌러도 코인이 중복 차감되지 않는다.
    day_start, day_end = _today_kst_bounds_as_utc()
    already_sent_today = (
        db.query(Letter.id)
        .filter(
            Letter.user_id == req.user_id,
            Letter.character_id == req.character_id,
            Letter.sent_at >= day_start,
            Letter.sent_at < day_end,
        )
        .first()
    )
    if already_sent_today:
        raise HTTPException(
            status_code=429,
            detail="이 기장님께는 오늘 이미 편지를 보냈어요. 내일 다시 마음을 전해 주세요.",
        )

    if economy.coins < LETTER_COST:
        raise HTTPException(status_code=400, detail="코인이 부족합니다")

    economy.coins -= LETTER_COST

    letter = Letter(
        id=str(uuid.uuid4()),
        user_id=req.user_id,
        character_id=req.character_id,
        content=req.content.strip(),
        reply_content=None,
        # KST 기준 일일 제한을 일관되게 계산하도록 새 편지는 UTC로 명시한다.
        sent_at=datetime.now(timezone.utc).replace(tzinfo=None),
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
async def list_letters(user_id: str, character_id: str, current_user_id: str = Depends(require_current_user), db: Session = Depends(get_db)):
    """우편함 조회 — 답장 시간이 지났는데 아직 안 만들어진 편지는 이 시점에 생성한다."""
    require_same_user(current_user_id, user_id)
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
            letter.reply_content = await _generate_reply_or_fallback(character_id, letter.content)
    db.commit()

    return [_to_response(letter) for letter in letters]


@router.post("/{letter_id}/read", response_model=LetterResponse)
def mark_letter_read(letter_id: str, current_user_id: str = Depends(require_current_user), db: Session = Depends(get_db)):
    """답장을 읽음 처리 (우편함 안 읽은 편지 배지 표시용)"""
    letter = db.query(Letter).filter(Letter.id == letter_id).first()
    if not letter:
        raise HTTPException(status_code=404, detail="Letter not found")
    require_same_user(current_user_id, letter.user_id)

    letter.is_read = True
    db.commit()
    db.refresh(letter)
    return _to_response(letter)
